import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { counts, sceneState } from './sceneState'
import { W, presence } from '../lib/timeline'
import type { Tier } from '../lib/journeyState'

/** Hyaluronic acid molecules: soft shelled particles drifting through the dermis. */
const vertex = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
varying float vAlpha;
varying float vSeed;
void main(){
  vec3 p = position;
  float s = aSeed * 50.0;
  p += vec3(sin(uTime * 0.11 + s), sin(uTime * 0.07 + s * 1.3) * 0.6, cos(uTime * 0.09 + s * 0.7)) * 0.18;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float d = -mv.z;
  gl_PointSize = uSize * (0.5 + aSeed) * uPixelRatio / max(d, 0.1);
  vAlpha = smoothstep(0.15, 0.8, d) * (1.0 - smoothstep(4.0, 9.0, d));
  vSeed = aSeed;
  gl_Position = projectionMatrix * mv;
}
`
const fragment = /* glsl */ `
uniform float uOpacity;
uniform vec3 uColor;
varying float vAlpha;
varying float vSeed;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.22, 0.0, d);
  float shell = smoothstep(0.035, 0.0, abs(d - 0.36)) * 0.7;
  float halo = smoothstep(0.5, 0.0, d) * 0.12;
  float a = (core * 0.55 + shell + halo) * vAlpha * uOpacity;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor * a, 1.0);
  #include <colorspace_fragment>
}
`

export function Hyaluronic({ tier }: { tier: Tier }) {
  const pts = useRef<THREE.Points>(null)
  const dpr = useThree((s) => s.viewport.dpr)
  const k = counts(tier).k
  const geo = useMemo(() => {
    const n = Math.round(1400 * k)
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = -3.5 + Math.random() * 7
      pos[i * 3 + 1] = -0.8 - Math.random() * 7.4
      pos[i * 3 + 2] = -5 + Math.random() * 7.5
      seed[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [k])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uPixelRatio: { value: 1 },
          uSize: { value: 26 },
          uColor: { value: new THREE.Color('#fff4ec') },
        },
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  useFrame(() => {
    const p = sceneState.p
    const a = presence(W.epidermis.start + 0.02, W.laser.start, p, 0.05, 0.04)
    if (pts.current) pts.current.visible = a > 0.001
    mat.uniforms.uOpacity.value = a
    mat.uniforms.uTime.value = sceneState.time
    mat.uniforms.uPixelRatio.value = dpr
  })
  return <points ref={pts} geometry={geo} material={mat} frustumCulled={false} />
}
