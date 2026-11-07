import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { counts, sceneState } from './sceneState'
import { W, presence } from '../lib/timeline'
import type { Tier } from '../lib/journeyState'

/**
 * Stylised epidermis: four strata of translucent, softly glowing cell membranes.
 * corneum (flat plates) → granulosum → spinosum (polyhedral) → basale (columnar).
 * One instanced draw call, additive, depth-write off.
 */
const layers = [
  { name: 'corneum', y: [-0.12, -0.7], n: 170, s: [0.26, 0.026, 0.22], jitter: 0.25, color: '#f6e6d8' },
  { name: 'granulosum', y: [-0.85, -1.35], n: 100, s: [0.18, 0.07, 0.17], jitter: 0.3, color: '#f1d2bf' },
  { name: 'spinosum', y: [-1.5, -2.6], n: 150, s: [0.14, 0.125, 0.14], jitter: 0.25, color: '#e9bba4' },
  { name: 'basale', y: [-2.75, -3.2], n: 120, s: [0.075, 0.16, 0.075], jitter: 0.15, color: '#de9f88' },
]

const vertex = /* glsl */ `
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime;
varying vec3 vN;
varying vec3 vV;
varying vec3 vColor;
varying float vDepth;
varying float vPhase;
void main(){
  vec3 pos = position;
  pos += normal * (sin(position.x * 5.0 + uTime * 0.8 + aPhase * 6.28) * 0.05 + sin(position.y * 4.0 + uTime * 0.6 + aPhase * 3.0) * 0.04);
  vec4 wp = modelMatrix * instanceMatrix * vec4(pos, 1.0);
  wp.xz += vec2(sin(uTime * 0.15 + aPhase * 6.0), cos(uTime * 0.12 + aPhase * 4.0)) * 0.04;
  wp.y += sin(uTime * 0.2 + aPhase * 8.0) * 0.025;
  vec4 mv = viewMatrix * wp;
  vN = normalize(mat3(viewMatrix) * mat3(modelMatrix * instanceMatrix) * normal);
  vV = normalize(-mv.xyz);
  vDepth = -mv.z;
  vColor = aColor;
  vPhase = aPhase;
  gl_Position = projectionMatrix * mv;
}
`
const fragment = /* glsl */ `
uniform float uOpacity;
uniform float uTime;
varying vec3 vN;
varying vec3 vV;
varying vec3 vColor;
varying float vDepth;
varying float vPhase;
void main(){
  float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
  float membrane = pow(f, 3.4);
  float core = pow(1.0 - f, 14.0);
  float breathe = 0.85 + 0.15 * sin(uTime * 0.7 + vPhase * 12.0);
  vec3 col = vColor * (membrane * 0.62 + core * 0.16 + 0.025) * breathe;
  float near = smoothstep(0.35, 1.3, vDepth);
  float far = 1.0 - smoothstep(3.5, 8.5, vDepth);
  col *= near * far * uOpacity;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`

export function Epidermis({ tier }: { tier: Tier }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const k = counts(tier).k
  const { geo, total } = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, tier === 'low' ? 1 : 2)
    const total = layers.reduce((a, l) => a + Math.round(l.n * k), 0)
    const phases = new Float32Array(total)
    const colors = new Float32Array(total * 3)
    let i = 0
    const c = new THREE.Color()
    for (const l of layers) {
      c.set(l.color)
      for (let j = 0; j < Math.round(l.n * k); j++, i++) {
        phases[i] = Math.random()
        const v = 0.75 + Math.random() * 0.4
        colors.set([c.r * v, c.g * v, c.b * v], i * 3)
      }
    }
    g.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1))
    g.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3))
    return { geo: g, total }
  }, [k, tier])

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } },
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  )

  const setRef = (m: THREE.InstancedMesh | null) => {
    mesh.current = m
    if (!m || m.userData.placed) return
    const o = new THREE.Object3D()
    let i = 0
    for (const l of layers) {
      const n = Math.round(l.n * k)
      for (let j = 0; j < n; j++, i++) {
        // keep a clear corridor along the camera's descent
        do {
          o.position.set(-3.6 + Math.random() * 7.2, l.y[0] + Math.random() * (l.y[1] - l.y[0]), -5.5 + Math.random() * 7.5)
        } while (Math.abs(o.position.x - 0.1) < 0.55 && o.position.z > -0.9 && o.position.z < 0.6)
        const js = 1 - l.jitter / 2 + Math.random() * l.jitter
        o.scale.set(l.s[0] * js, l.s[1] * (0.8 + Math.random() * 0.4), l.s[2] * js)
        o.rotation.set((Math.random() - 0.5) * 0.25, Math.random() * Math.PI, (Math.random() - 0.5) * 0.25)
        o.updateMatrix()
        m.setMatrixAt(i, o.matrix)
      }
    }
    m.instanceMatrix.needsUpdate = true
    m.userData.placed = true
  }

  useFrame(() => {
    const p = sceneState.p
    const a = presence(W.epidermis.start - 0.02, W.dermis.start + 0.04, p, 0.04, 0.06)
    if (mesh.current) mesh.current.visible = a > 0.001
    mat.uniforms.uOpacity.value = a
    mat.uniforms.uTime.value = sceneState.time
  })

  return <instancedMesh ref={setRef} args={[geo, mat, total]} frustumCulled={false} />
}
