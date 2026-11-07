import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createSkinMaterial } from './shaders/skin'
import { DROP, dropPhase, sceneState, counts } from './sceneState'
import { W } from '../lib/timeline'
import type { Tier } from '../lib/journeyState'

export function SkinSurface({ tier }: { tier: Tier }) {
  const mesh = useRef<THREE.Mesh>(null)
  const seg = counts(tier).surfaceSeg
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(18, 18, seg, seg)
    g.rotateX(-Math.PI / 2)
    return g
  }, [seg])
  const mat = useMemo(() => {
    const m = createSkinMaterial()
    m.uniforms.uDropPos.value.set(DROP.hang.x, DROP.hang.z)
    m.uniforms.uPool.value.set(DROP.hang.x - 0.1, 0, DROP.hang.z - 0.4)
    return m
  }, [])

  useFrame(() => {
    const p = sceneState.p
    const visible = p < W.epidermis.start + 0.05
    if (mesh.current) mesh.current.visible = visible
    if (!visible) return
    const u = mat.uniforms
    u.uTime.value = sceneState.time
    u.uDropTime.value = dropPhase(sceneState.time).rippleTime
    u.uFogColor.value.copy(sceneState.fog)
    u.uFogNear.value = sceneState.fogNear
    u.uFogFar.value = sceneState.fogFar
  })

  return <mesh ref={mesh} geometry={geo} material={mat} frustumCulled={false} />
}
