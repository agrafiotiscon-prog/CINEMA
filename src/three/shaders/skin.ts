import * as THREE from 'three'
import { noiseGLSL } from './noise'

/**
 * Procedural skin: glyphic furrow network + pores + micro texture (height field),
 * analytic-ish normals via finite differences, wrap diffuse with a red-shifted
 * subsurface term at the terminator, two GGX lobes (oil + dew), studio softbox sheen,
 * fresnel rim. Optional TREATMENT define adds laser / needling / peel / volume effects.
 */

const common = /* glsl */ `
uniform float uTime;
uniform float uPoreDepth;
uniform float uLineDepth;
uniform float uScale;
uniform float uBump;
uniform vec2  uDropPos;
uniform float uDropTime;
uniform float uRenew;
uniform float uMacro;
#ifdef TREATMENT
uniform float uLaserX;
uniform float uLaserAmt;
uniform float uNeedle;
uniform float uNeedleTime;
uniform float uPeel;
uniform float uPeelAmt;
uniform float uVolume;
uniform float uVolumeAmt;
uniform float uImprove;
#endif
${noiseGLSL}

float ripple(vec2 p){
  if(uDropTime < 0.0) return 0.0;
  float t = uDropTime;
  float r = length(p - uDropPos);
  float front = 0.08 + t * 0.62;
  float inside = smoothstep(front + 0.04, front - 0.35, r);
  float env = exp(-t * 0.75) * inside * exp(-r * 1.1);
  float crown = exp(-t * 6.0) * exp(-r * r * 160.0) * -1.0;
  return (sin(r * 34.0 - t * 13.0) * env * 0.015 + crown * 0.03);
}

float macroH(vec2 p){
  float h = (fbm(p * 0.35 + 3.7) - 0.5) * 0.22 * uMacro;
  #ifdef TREATMENT
  // a soft fold that the injectable restores
  vec2 q = p - vec2(0.15, 0.0);
  float curve = q.x - 0.28 * sin(q.y * 1.1) - 0.12 * q.y * q.y * 0.3;
  float fold = exp(-curve * curve / 0.05) * smoothstep(1.9, 0.6, abs(q.y));
  h -= fold * 0.13 * (1.0 - uVolume);
  #endif
  return h;
}

// one family of long, gently wandering furrows (V profile), depth varying along its length
float lineSet(vec2 q, float ang, float freq, float w, float seed){
  vec2 d = vec2(cos(ang), sin(ang));
  float t = dot(q, d) * freq + 0.38 * vnoise(q * 0.5 + seed) + 0.14 * vnoise(q * 2.1 + seed * 2.0);
  float f = abs(fract(t) - 0.5) * 2.0;
  float strength = 0.35 + 0.65 * smoothstep(0.25, 0.75, vnoise(q * 0.45 + seed * 3.0));
  return pow(1.0 - smoothstep(0.0, w, f), 1.8) * strength;
}

// micro relief; returns height, writes cavity term (0 = flat, 1 = deep pit/furrow)
float microH(vec2 p, out float cavity, float relief){
  vec2 q = p * uScale;
  q += 0.3 * vec2(vnoise(q * 0.35), vnoise(q * 0.35 + 7.3));
  // primary dermatoglyphic lines: three crossing families -> diamonds & triangles
  float l1 = lineSet(q, 0.35, 0.72, 0.15, 1.0);
  float l2 = lineSet(q, 1.45, 0.78, 0.15, 5.0);
  float l3 = lineSet(q, 2.45, 0.66, 0.13, 9.0);
  float primary = max(max(l1, l2), l3);
  // secondary fine lines
  float s1 = lineSet(q * 2.3, 0.9, 0.7, 0.2, 13.0);
  float s2 = lineSet(q * 2.3, 2.0, 0.7, 0.2, 17.0);
  float secondary = max(s1, s2) * 0.5;
  // pillowy plateaus: soft voronoi domes
  vec2 v = voronoi(q * 1.6 + 3.0);
  float dome = sqrt(smoothstep(0.0, 0.6, v.y - v.x));
  // pores: sparse, soft pits
  float pore = (1.0 - smoothstep(0.03, 0.11, v.x)) * step(0.78, hash12(floor(q * 1.6 + 3.0)));
  float fine = vnoise(q * 13.0) * 0.6 + vnoise(q * 29.0) * 0.4;
  float lines = (primary * 0.85 + secondary * 0.45) * uLineDepth;
  float pores = pore * uPoreDepth;
  cavity = clamp((primary * 0.75 + secondary * 0.35 + pore * 0.9) * relief, 0.0, 1.0);
  return (-lines - pores + dome * 0.22 * uLineDepth + (fine - 0.5) * 0.12) * relief;
}
`

const vertex = /* glsl */ `
${common}
varying vec3 vWorld;
varying vec2 vP;
varying float vEdge;
uniform vec2 uHalf;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec2 p = wp.xz;
  #ifdef TREATMENT
  p = position.xy * vec2(1.0, -1.0);
  vec2 e = smoothstep(uHalf, uHalf - 0.35, abs(position.xy));
  vEdge = e.x * e.y;
  #else
  vEdge = 1.0;
  #endif
  float h = (macroH(p) + ripple(p)) * vEdge;
  wp.y += h;
  vWorld = wp.xyz;
  vP = p;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

const fragment = /* glsl */ `
${common}
varying vec3 vWorld;
varying vec2 vP;
varying float vEdge;
uniform vec3 uBase;
uniform vec3 uDeep;
uniform vec3 uKeyDir;
uniform vec3 uKeyColor;
uniform vec3 uFillDir;
uniform vec3 uFillColor;
uniform vec3 uRimColor;
uniform vec3 uGlow;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uOpacity;
uniform float uExposure;
uniform vec3 uPool;
uniform float uPoolR;

float D_GGX(float NdH, float a){ float a2 = a*a; float d = NdH*NdH*(a2-1.0)+1.0; return a2/(3.14159*d*d); }

float totalH(vec2 p, out float cav, float relief){
  return macroH(p) + ripple(p) + microH(p, cav, relief) * uBump;
}

void main(){
  vec2 p = vP;
  float relief = mix(1.0, 0.28, uRenew);
  vec3 emissive = vec3(0.0);
  float smoothBonus = 0.0;
  vec3 tint = vec3(1.0);

  #ifdef TREATMENT
  float improve = uImprove;
  // Laser: line beam sweeping along x. Region behind the beam is resurfaced.
  float beamX = mix(-2.2, 2.2, uLaserX);
  float behind = smoothstep(beamX + 0.03, beamX - 0.25, p.x) * step(0.001, uLaserX);
  improve += 0.22 * behind;
  // Needling: expanding regeneration pulse from the centre
  float nt = fract(uNeedleTime * 0.22);
  float rr = length(p);
  float ringR = nt * 3.2;
  float pulse = smoothstep(0.09, 0.0, abs(rr - ringR)) * (1.0 - nt) * uNeedle;
  // Peel: noise threshold dissolves the old layer
  float pn = fbm(p * 1.4 + 2.0);
  float peeled = smoothstep(pn - 0.02, pn + 0.02, uPeel * 1.15 - 0.05);
  float pw = max(fwidth(pn) * 1.2, 0.0015);
  float peelEdge = (1.0 - smoothstep(0.0, pw, abs(uPeel * 1.15 - 0.05 - pn))) * uPeelAmt * (1.0 - step(0.999, uPeel));
  improve += 0.2 * peeled;
  improve = clamp(improve, 0.0, 1.0);
  relief *= mix(1.0, 0.32, improve);
  smoothBonus = improve;
  // the old, uneven layer is slightly mottled and darker before peel
  tint = mix(vec3(1.0), vec3(0.8, 0.66, 0.62), (1.0 - peeled) * uPeelAmt);
  tint *= mix(1.0, 1.06, peeled * uPeelAmt);
  #endif

  float cav, cx, cz;
  float eps = 0.0035;
  float h  = totalH(p, cav, relief);
  float hx = totalH(p + vec2(eps, 0.0), cx, relief);
  float hz = totalH(p + vec2(0.0, eps), cz, relief);
  #ifdef TREATMENT
  // peeled area sits fractionally lower: a visible step at the edge
  #endif
  vec3 N = normalize(vec3(-(hx - h) / eps, 1.0, -(hz - h) / eps));
  N = normalize(mix(vec3(0.0, 1.0, 0.0), N, vEdge * 0.9 + 0.1));
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 L = normalize(uKeyDir);
  vec3 F = normalize(uFillDir);

  // albedo: melanin mottling + slight redness, cavities darker
  float mel = fbm(p * 1.1 + 5.0);
  float red = smoothstep(0.55, 0.85, fbm(p * 0.8 + 19.0)) * (1.0 - uRenew) * (1.0 - smoothBonus);
  vec3 albedo = uBase * mix(1.04, 0.86, mel * (1.0 - 0.6 * uRenew));
  albedo = mix(albedo, albedo * vec3(1.05, 0.8, 0.78), red * 0.6);
  albedo *= tint;
  albedo *= mix(1.0, 0.55, cav);

  float NdL = dot(N, L);
  float wrapD = max(0.0, (NdL + 0.5) / 1.5);
  float sss = smoothstep(-0.45, 0.25, NdL) * (1.0 - smoothstep(0.25, 0.9, NdL));
  vec3 col = albedo * wrapD * uKeyColor;
  col += uDeep * sss * 0.55 * uKeyColor * (1.0 - cav * 0.5);
  float NdF = max(0.0, dot(N, F) * 0.5 + 0.5);
  col += albedo * NdF * uFillColor;
  // cavities glow faintly red: light scattering inside pores
  col += uDeep * cav * 0.08 * uKeyColor;

  // specular: oily lobe + dewy lobe modulated by moisture map
  vec3 H = normalize(L + V);
  float NdH = max(dot(N, H), 0.0);
  float NdV = max(dot(N, V), 0.0);
  float fres = 0.028 + 0.972 * pow(1.0 - NdV, 5.0);
  float dew = (0.35 + 0.65 * smoothstep(0.3, 0.8, fbm(p * 1.1 + 31.0))) * (0.6 + uRenew * 0.5 + smoothBonus * 0.3);
  float spec = D_GGX(NdH, 0.4) * 0.14 + D_GGX(NdH, mix(0.15, 0.1, uRenew)) * dew * 0.32;
  spec *= max(NdL, 0.0) * (1.0 - cav * 0.8);
  col += uKeyColor * spec * (0.4 + fres * 2.2);

  // studio softbox reflection (broad sheen streak)
  vec3 R = reflect(-V, N);
  float box = smoothstep(0.72, 0.98, dot(R, normalize(vec3(-0.35, 0.55, -0.75))));
  col += uRimColor * box * (0.05 + fres * 0.6) * (0.4 + 0.6 * dew) * (1.0 - cav);
  // rim / sheen
  float rim = pow(1.0 - NdV, 3.5);
  col += uRimColor * rim * 0.22;

  #ifdef TREATMENT
  // laser hot line + fractional micro thermal zones behind it
  float line = exp(-pow((p.x - beamX) * 70.0, 2.0)) * uLaserAmt;
  vec2 g = fract(p * 9.0) - 0.5;
  float mtz = smoothstep(0.09, 0.0, length(g)) * behind * exp(-(beamX - p.x) * 2.2) * uLaserAmt;
  emissive += uGlow * (line * 1.6 + mtz * 0.6);
  emissive += vec3(1.0, 0.92, 0.85) * line * 0.7;
  // needling punctures and collagen pulse
  vec2 g2 = fract(p * 6.0 + 0.5) - 0.5;
  float pin = smoothstep(0.05, 0.0, length(g2)) * uNeedle * (0.35 + 0.65 * pow(0.5 + 0.5 * sin(uNeedleTime * 6.0 + hash12(floor(p * 6.0 + 0.5)) * 6.28), 6.0));
  emissive += uGlow * (pin * 1.4 + pulse * 0.9);
  // peel edge glow
  emissive += uGlow * peelEdge * 0.75;
  // volume: soft light beneath the restoring fold
  vec2 q = p - vec2(0.15, 0.0);
  float curve = q.x - 0.28 * sin(q.y * 1.1) - 0.12 * q.y * q.y * 0.3;
  float fold = exp(-curve * curve / 0.05) * smoothstep(1.9, 0.6, abs(q.y));
  col *= 1.0 - fold * (1.0 - uVolume) * (0.12 + 0.3 * uVolumeAmt);
  emissive += uGlow * fold * uVolumeAmt * (0.25 + 0.75 * sin(3.14159 * clamp(uVolume, 0.0, 1.0))) * 0.55;
  #endif

  // cinematic pool of light: falloff away from the key spot
  float pd = length(vWorld.xz - uPool.xz);
  col *= mix(0.22, 1.0, exp(-pd * pd / (uPoolR * uPoolR)));
  // renewal luminosity
  col = mix(col, col * 1.12 + uGlow * 0.06, uRenew);
  col += emissive;
  col *= uExposure;

  float d = length(cameraPosition - vWorld);
  float fog = smoothstep(uFogNear, uFogFar, d);
  col = mix(col, uFogColor, fog);
  gl_FragColor = vec4(col, uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export interface SkinOptions {
  treatment?: boolean
}

export function createSkinMaterial({ treatment = false }: SkinOptions = {}) {
  const uniforms: Record<string, THREE.IUniform> = {
    uTime: { value: 0 },
    uPoreDepth: { value: 0.5 },
    uLineDepth: { value: 0.8 },
    uScale: { value: 4.4 },
    uBump: { value: 0.013 },
    uMacro: { value: 1 },
    uDropPos: { value: new THREE.Vector2(0.25, -0.15) },
    uDropTime: { value: -1 },
    uRenew: { value: 0 },
    uBase: { value: new THREE.Color('#c48e78') },
    uDeep: { value: new THREE.Color('#b0362a') },
    uKeyDir: { value: new THREE.Vector3(-0.55, 0.6, -0.7) },
    uKeyColor: { value: new THREE.Color('#ffe6d6').multiplyScalar(1.05) },
    uFillDir: { value: new THREE.Vector3(0.6, 0.5, 0.8) },
    uFillColor: { value: new THREE.Color('#4a302c').multiplyScalar(0.4) },
    uRimColor: { value: new THREE.Color('#ffd9c4') },
    uGlow: { value: new THREE.Color('#e7b79b') },
    uFogColor: { value: new THREE.Color('#0d0908') },
    uFogNear: { value: 2.2 },
    uFogFar: { value: 9 },
    uOpacity: { value: 1 },
    uExposure: { value: 1 },
    uPool: { value: new THREE.Vector3(0.6, 0, -0.2) },
    uPoolR: { value: 1.45 },
    uHalf: { value: new THREE.Vector2(2, 2) },
  }
  if (treatment) {
    Object.assign(uniforms, {
      uLaserX: { value: 0 },
      uLaserAmt: { value: 0 },
      uNeedle: { value: 0 },
      uNeedleTime: { value: 0 },
      uPeel: { value: 0 },
      uPeelAmt: { value: 0 },
      uVolume: { value: 0 },
      uVolumeAmt: { value: 0 },
      uImprove: { value: 0 },
    })
  }
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vertex,
    fragmentShader: fragment,
    defines: treatment ? { TREATMENT: '' } : {},
    transparent: false,
  })
}
