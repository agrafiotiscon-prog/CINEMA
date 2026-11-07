import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DROP, dropPhase, sceneState } from './sceneState'
import { W } from '../lib/timeline'
import type { Tier } from '../lib/journeyState'

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** A serum droplet: forms, hangs, falls in slow motion, merges into the skin and leaves a ripple. */
export function Droplet({ tier }: { tier: Tier }) {
  const mesh = useRef<THREE.Mesh>(null)
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = []
    const n = 48
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI
      const r = Math.sin(t) * Math.pow(Math.sin(t / 2), 1.15)
      pts.push(new THREE.Vector2(Math.max(r, 0.0001), Math.cos(t) * 1.1))
    }
    return new THREE.LatheGeometry(pts, 64)
  }, [])
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#fff7f2',
        roughness: 0.03,
        metalness: 0,
        transmission: tier === 'low' ? 0 : 1,
        transparent: tier === 'low',
        opacity: tier === 'low' ? 0.55 : 1,
        thickness: 0.35,
        ior: 1.38,
        attenuationColor: new THREE.Color('#f1c6ae'),
        attenuationDistance: 0.9,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.6,
        specularIntensity: 1,
      }),
    [tier],
  )

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const p = sceneState.p
    if (p > W.epidermis.start) {
      m.visible = false
      return
    }
    const { c } = dropPhase(sceneState.time)
    const base = 0.13
    let s = 0
    let y = DROP.hang.y
    let stretch = 1
    let wobble = 0
    if (c < DROP.formEnd) {
      const k = easeOut(c / DROP.formEnd)
      s = base * k
      y = DROP.hang.y + 0.08 * (1 - k)
      stretch = 1 + 0.25 * k
    } else if (c < DROP.fallStart) {
      s = base
      const t = c - DROP.formEnd
      wobble = Math.sin(t * 14) * Math.exp(-t * 3) * 0.06
      stretch = 1.25 + wobble + (t / (DROP.fallStart - DROP.formEnd)) * 0.15
    } else if (c < DROP.impact) {
      const t = (c - DROP.fallStart) / DROP.fallDur
      s = base
      y = DROP.hang.y - DROP.hang.y * t * t
      stretch = 1.4 - 0.35 * t
    } else {
      const t = (c - DROP.impact) / 0.16
      s = t < 1 ? base * (1 - t) : 0
      y = 0.02
      stretch = 0.5
    }
    m.visible = s > 0.0005
    m.position.set(DROP.hang.x, y + 1.1 * s * stretch * 0.75, DROP.hang.z)
    m.scale.set(s / Math.sqrt(stretch), s * stretch * 0.75, s / Math.sqrt(stretch))
  })

  return <mesh ref={mesh} geometry={geo} material={mat} />
}
