import * as THREE from 'three'
import type { Tier } from '../lib/journeyState'

/** Per-frame derived scene values shared by all objects (written by CameraRig, read by materials). */
export const sceneState = {
  p: 0,
  fog: new THREE.Color('#0d0908'),
  fogNear: 2.2,
  fogFar: 9,
  /** 0..1 chromatic aberration pulse on transitions */
  transition: 0,
  time: 0,
  tier: 'high' as Tier,
  /** world-space focus point for depth of field */
  focus: new THREE.Vector3(),
}

export const DARK = new THREE.Color('#0d0908')
export const PORCELAIN = new THREE.Color('#f3ece5')

/** Droplet cycle, shared by the droplet mesh and the ripple in the skin shader. */
export const DROP = {
  cycle: 9,
  formEnd: 2.4,
  fallStart: 3.4,
  fallDur: 0.78,
  hang: new THREE.Vector3(0.74, 0.5, 0.2),
  get impact() {
    return this.fallStart + this.fallDur
  },
}
export function dropPhase(t: number) {
  const c = t % DROP.cycle
  const rippleTime = c >= DROP.impact ? c - DROP.impact : c + DROP.cycle - DROP.impact
  return { c, rippleTime }
}

export const counts = (tier: Tier) => {
  const k = tier === 'high' ? 1 : tier === 'medium' ? 0.7 : 0.42
  return {
    k,
    surfaceSeg: tier === 'high' ? 260 : tier === 'medium' ? 180 : 110,
    stageSeg: tier === 'high' ? 200 : tier === 'medium' ? 140 : 90,
  }
}
