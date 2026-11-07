import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { counts, sceneState } from './sceneState'
import { W, presence, smooth } from '../lib/timeline'
import type { Tier } from '../lib/journeyState'

/**
 * The dermis: a weave of collagen bundles (thick, crimped) and elastin (thin, coiled),
 * merged into one geometry. uOrder scrubs from chaotic → aligned & taut: the rejuvenation metaphor.
 */
const vertex = /* glsl */ `
attribute float aSeed;
attribute float aKind;
uniform float uTime;
uniform float uOrder;
varying vec3 vN;
varying vec3 vV;
varying float vAlong;
varying float vSeed;
varying float vKind;
varying float vDepth;
void main(){
  float s = aSeed * 40.0;
  float a = uv.x;
  vec3 chaos = vec3(
    sin(a * 7.0 + s) + 0.5 * sin(a * 17.0 + s * 1.7),
    sin(a * 5.0 + s * 2.3) + 0.6 * sin(a * 13.0 + s * 0.7),
    cos(a * 6.0 + s * 1.3) + 0.5 * sin(a * 11.0 + s * 2.9)
  );
  float dis = 1.0 - uOrder;
  vec3 pos = position + chaos * (0.42 * dis * dis + 0.012);
  pos.y += sin(uTime * 0.35 + s) * 0.02;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  vAlong = a; vSeed = aSeed; vKind = aKind; vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`
const fragment = /* glsl */ `
uniform float uTime;
uniform float uOrder;
uniform float uOpacity;
uniform vec3 uCollagen;
uniform vec3 uElastin;
uniform vec3 uHot;
varying vec3 vN;
varying vec3 vV;
varying float vAlong;
varying float vSeed;
varying float vKind;
varying float vDepth;
void main(){
  float ndv = abs(dot(normalize(vN), normalize(vV)));
  float rim = pow(1.0 - ndv, 1.4);
  float body = pow(ndv, 2.0);
  vec3 base = mix(uCollagen, uElastin, vKind);
  float speed = 0.06 + 0.12 * uOrder;
  float ph = fract(vAlong * 1.6 - uTime * speed + vSeed * 7.0);
  float pulse = smoothstep(0.86, 0.97, ph) * (1.0 - smoothstep(0.97, 1.0, ph));
  float energy = 0.35 + 0.65 * uOrder;
  vec3 col = base * (0.04 + rim * 0.42 + body * 0.07) * energy + uHot * pulse * (0.2 + 1.0 * uOrder);
  float near = smoothstep(0.45, 1.5, vDepth);
  float far = 1.0 - smoothstep(3.5, 9.0, vDepth);
  gl_FragColor = vec4(col * near * far * uOpacity, 1.0);
  #include <colorspace_fragment>
}
`

function rand(a: number, b: number) {
  return a + Math.random() * (b - a)
}

export function Collagen({ tier }: { tier: Tier }) {
  const mesh = useRef<THREE.Mesh>(null)
  const k = counts(tier).k
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    const nCol = Math.round(95 * k)
    const nEla = Math.round(30 * k)
    const radial = tier === 'low' ? 4 : 6
    const tubular = tier === 'low' ? 48 : 90
    const add = (kind: number) => {
      const alongX = Math.random() < 0.55
      const ang = rand(-0.14, 0.14)
      const dir = alongX ? new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang)) : new THREE.Vector3(Math.sin(ang), 0, Math.cos(ang))
      dir.y = rand(-0.08, 0.08)
      dir.normalize()
      const center = new THREE.Vector3(rand(-3.2, 3.2), rand(-4.2, -7.8), rand(-5.2, 2.4))
      const len = rand(5, 8.5)
      const up = new THREE.Vector3(0, 1, 0)
      const side = new THREE.Vector3().crossVectors(dir, up).normalize()
      const pts: THREE.Vector3[] = []
      const n = kind ? 40 : 16
      const crimp = rand(3.5, 5.5)
      const amp = kind ? 0.07 : rand(0.04, 0.07)
      for (let i = 0; i <= n; i++) {
        const t = i / n
        const pt = center.clone().addScaledVector(dir, (t - 0.5) * len)
        if (kind) {
          const a = t * Math.PI * 2 * 9
          pt.addScaledVector(up, Math.sin(a) * amp).addScaledVector(side, Math.cos(a) * amp)
        } else {
          pt.addScaledVector(up, Math.sin(t * Math.PI * 2 * crimp) * amp)
        }
        pts.push(pt)
      }
      const curve = new THREE.CatmullRomCurve3(pts)
      const r = kind ? rand(0.0035, 0.006) : rand(0.009, 0.022)
      const tube = new THREE.TubeGeometry(curve, kind ? tubular * 2 : tubular, r, radial, false)
      const count = tube.attributes.position.count
      const seed = Math.random()
      tube.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(count).fill(seed), 1))
      tube.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(count).fill(kind), 1))
      parts.push(tube)
    }
    for (let i = 0; i < nCol; i++) add(0)
    for (let i = 0; i < nEla; i++) add(1)
    const merged = mergeGeometries(parts, false)
    parts.forEach((p) => p.dispose())
    return merged
  }, [k, tier])

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOrder: { value: 0 },
          uOpacity: { value: 0 },
          uCollagen: { value: new THREE.Color('#e7b79b') },
          uElastin: { value: new THREE.Color('#fbf3ec') },
          uHot: { value: new THREE.Color('#ffe2cf') },
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
    const a = presence(W.dermis.start - 0.02, W.laser.start + 0.01, p, 0.05, 0.04)
    if (mesh.current) mesh.current.visible = a > 0.001
    mat.uniforms.uOpacity.value = a
    mat.uniforms.uTime.value = sceneState.time
    mat.uniforms.uOrder.value = smooth(W.dermis.start + 0.01, W.dermis.end - 0.02, p)
  })

  return <mesh ref={mesh} geometry={geo} material={mat} frustumCulled={false} />
}
