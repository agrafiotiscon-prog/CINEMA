import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Bloom, ChromaticAberration, DepthOfField, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode, type ChromaticAberrationEffect, type DepthOfFieldEffect } from 'postprocessing'
import * as THREE from 'three'
import { LensEffect } from './LensEffect'
import { journey, type Tier } from '../lib/journeyState'
import { sceneState } from './sceneState'

/** Cinematic post stack. high: DoF + bloom + lens + CA + vignette. medium: no DoF. low: not mounted. */
export function Post({ tier }: { tier: Tier }) {
  const size = useThree((s) => s.size)
  const lens = useMemo(() => new LensEffect(), [])
  const ca = useRef<ChromaticAberrationEffect>(null)
  const dof = useRef<DepthOfFieldEffect>(null)
  const caOffset = useMemo(() => new THREE.Vector2(0, 0), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const mouse = useMemo(() => new THREE.Vector2(0.5, 0.5), [])
  const tmp = useMemo(() => new THREE.Vector2(), [])
  const last = useRef({ x: 0.5, y: 0.5, energy: 0 })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const ptr = journey.pointer
    const l = last.current
    const speed = Math.hypot(ptr.x - l.x, ptr.y - l.y) / Math.max(dt, 1e-3)
    l.x = ptr.x
    l.y = ptr.y
    l.energy = THREE.MathUtils.lerp(l.energy, Math.min(speed * 0.08, 1), 1 - Math.exp(-dt * 6))
    mouse.lerp(tmp.set(ptr.x, 1 - ptr.y), 1 - Math.exp(-dt * 10))
    const u = lens.uniforms
    u.get('uMouse')!.value.copy(mouse)
    u.get('uAspect')!.value = size.width / size.height
    const base = ptr.active && !journey.reduced ? 0.16 : 0
    const s = u.get('uStrength')!
    s.value = THREE.MathUtils.lerp(s.value, base + l.energy * 0.22, 1 - Math.exp(-dt * 8))

    const t = sceneState.transition
    caOffset.set(0.0035 * t, 0.0018 * t)
    if (ca.current) ca.current.offset = caOffset
    if (dof.current) {
      target.copy(sceneState.focus)
      dof.current.target = target
    }
  })

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {tier === 'high' && <DepthOfField ref={dof} target={target} focalLength={0.06} bokehScale={2.4} worldFocusRange={1.4} />}
      <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.62} luminanceSmoothing={0.25} radius={0.72} />
      <primitive object={lens} />
      <ChromaticAberration ref={ca} offset={caOffset} radialModulation modulationOffset={0.25} blendFunction={BlendFunction.NORMAL} />
      <Vignette offset={0.28} darkness={0.62} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
