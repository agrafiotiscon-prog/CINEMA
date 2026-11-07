/** Shared procedural noise. All textures in the scene are generated from these functions. */
export const noiseGLSL = /* glsl */ `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }

float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float a = 0.5, s = 0.0;
  for(int i=0;i<4;i++){ s += a*vnoise(p); p = mat2(1.6,1.2,-1.2,1.6)*p; a *= 0.5; }
  return s;
}
float vnoise3(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p); vec3 u = f*f*(3.0-2.0*f);
  float a = hash13(i), b = hash13(i+vec3(1,0,0)), c = hash13(i+vec3(0,1,0)), d = hash13(i+vec3(1,1,0));
  float e = hash13(i+vec3(0,0,1)), f1 = hash13(i+vec3(1,0,1)), g = hash13(i+vec3(0,1,1)), h = hash13(i+vec3(1,1,1));
  return mix(mix(mix(a,b,u.x), mix(c,d,u.x), u.y), mix(mix(e,f1,u.x), mix(g,h,u.x), u.y), u.z);
}
/* Voronoi: returns (F1, F2) */
vec2 voronoi(vec2 p){
  vec2 n = floor(p); vec2 f = fract(p);
  float f1 = 8.0, f2 = 8.0;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 g = vec2(float(i), float(j));
    vec2 o = hash22(n+g);
    vec2 r = g + o - f;
    float d = dot(r,r);
    if(d < f1){ f2 = f1; f1 = d; } else if(d < f2){ f2 = d; }
  }
  return sqrt(vec2(f1, f2));
}
`
