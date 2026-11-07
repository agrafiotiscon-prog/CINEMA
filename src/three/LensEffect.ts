import { Effect } from 'postprocessing'
import * as THREE from 'three'

/**
 * Cursor "refraction lens": a soft magnifying/refracting bubble that follows the pointer
 * and bends the rendered scene (mainUv), with a faint caustic rim.
 */
const fragment = /* glsl */ `
uniform vec2 uMouse;
uniform float uStrength;
uniform float uRadius;
uniform float uAspect;

float lensMask(vec2 uv){
  vec2 d = uv - uMouse; d.x *= uAspect;
  return smoothstep(uRadius, 0.0, length(d));
}
void mainUv(inout vec2 uv){
  float f = lensMask(uv);
  uv -= (uv - uMouse) * f * f * uStrength;
}
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  vec2 d = uv - uMouse; d.x *= uAspect;
  float r = length(d);
  float ring = smoothstep(0.012, 0.0, abs(r - uRadius * 0.82)) * uStrength;
  outputColor = vec4(inputColor.rgb + vec3(1.0, 0.9, 0.84) * ring * 0.06, inputColor.a);
}
`

export class LensEffect extends Effect {
  constructor() {
    super('LensEffect', fragment, {
      uniforms: new Map<string, THREE.Uniform>([
        ['uMouse', new THREE.Uniform(new THREE.Vector2(0.5, 0.5))],
        ['uStrength', new THREE.Uniform(0)],
        ['uRadius', new THREE.Uniform(0.13)],
        ['uAspect', new THREE.Uniform(1)],
      ]),
    })
  }
}
