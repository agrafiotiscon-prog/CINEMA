import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { journey } from '../lib/journeyState'
import { W, smooth, type ChapterId } from '../lib/timeline'
import { DARK, PORCELAIN, sceneState } from './sceneState'

type Key = { p: number; pos: [number, number, number]; look: [number, number, number] }
const at = (id: ChapterId, f: number) => W[id].start + (W[id].end - W[id].start) * f

/** Camera keyframes. Positions & look targets are joined by centripetal Catmull-Rom splines. */
const keys: Key[] = [
  { p: 0, pos: [0.0, 1.15, 2.7], look: [0.35, 0.05, -0.3] },
  { p: at('surface', 0.55), pos: [-0.25, 0.72, 1.75], look: [0.5, 0.0, -0.25] },
  { p: at('surface', 0.97), pos: [0.35, 0.2, 0.55], look: [0.45, -1.4, -0.8] },
  { p: at('epidermis', 0.18), pos: [0.2, -0.5, 0.1], look: [0.0, -1.6, -1.4] },
  { p: at('epidermis', 0.6), pos: [-0.4, -1.55, -0.3], look: [0.3, -2.4, -2.0] },
  { p: at('epidermis', 1), pos: [0.1, -3.05, -0.2], look: [0.0, -4.6, -1.6] },
  { p: at('dermis', 0.35), pos: [-0.9, -4.6, 0.9], look: [0.2, -5.6, -1.2] },
  { p: at('dermis', 0.85), pos: [0.4, -5.6, 1.6], look: [0.0, -5.9, -0.8] },
  { p: at('laser', 0.08), pos: [2.5, -8.1, 4.3], look: [0.0, -10.45, 0.0] },
  { p: at('laser', 0.6), pos: [2.1, -8.75, 3.3], look: [0.0, -10.35, 0.0] },
  { p: at('needling', 0.5), pos: [-1.5, -8.65, 2.9], look: [0.0, -10.25, 0.0] },
  { p: at('peel', 0.5), pos: [-3.0, -8.9, 1.2], look: [0.0, -10.3, 0.0] },
  { p: at('volume', 0.55), pos: [1.0, -9.1, 2.5], look: [0.15, -10.3, 0.0] },
  { p: at('renewal', 0.45), pos: [0.0, -7.7, 4.6], look: [0.0, -10.3, 0.0] },
  { p: 1, pos: [0.0, -6.1, 3.7], look: [0.0, -10.25, -0.2] },
]

const UMBER = new THREE.Color('#7a5446')
const transitions = [W.epidermis.start + 0.012, W.laser.start + 0.004, W.renewal.start]

const easeSeg = (t: number) => {
  const s = t * t * (3 - 2 * t)
  return t + (s - t) * 0.6
}

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const scene = useThree((s) => s.scene)
  const size = useThree((s) => s.size)
  const { posCurve, lookCurve } = useMemo(
    () => ({
      posCurve: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, 'centripetal'),
      lookCurve: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.look)), false, 'centripetal'),
    }),
    [],
  )
  const tmpPos = useMemo(() => new THREE.Vector3(), [])
  const tmpLook = useMemo(() => new THREE.Vector3(), [])
  const bg = useMemo(() => new THREE.Color(), [])
  const parallax = useMemo(() => new THREE.Vector2(), [])
  const ptr = useMemo(() => new THREE.Vector2(), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20)
    // time: frozen under reduced motion
    if (!journey.reduced) sceneState.time += dt
    else sceneState.time = 3.0

    const raw = journey.progress
    const p = journey.reduced ? journey.reducedP : raw
    sceneState.p = p

    // segment lookup
    let i = 0
    while (i < keys.length - 2 && p > keys[i + 1].p) i++
    const a = keys[i]
    const b = keys[i + 1]
    const lt = THREE.MathUtils.clamp((p - a.p) / (b.p - a.p), 0, 1)
    const u = (i + easeSeg(lt)) / (keys.length - 1)
    posCurve.getPoint(u, tmpPos)
    lookCurve.getPoint(u, tmpLook)

    // portrait screens: dolly back from the subject so the specimen stays framed
    const aspectNow = size.width / size.height
    if (aspectNow < 1) {
      const stage = smooth(W.dermis.end - 0.03, W.laser.start + 0.02, p)
      const k = 1 + (1 - aspectNow) * (0.25 + 0.75 * stage)
      tmpPos.sub(tmpLook).multiplyScalar(k).add(tmpLook)
    }
    if (!journey.reduced) {
      const t = sceneState.time
      tmpPos.x += Math.sin(t * 0.31) * 0.025
      tmpPos.y += Math.sin(t * 0.23 + 1.0) * 0.018
      parallax.lerp(ptr.set(journey.pointer.x - 0.5, journey.pointer.y - 0.5), 1 - Math.exp(-dt * 2.5))
      tmpPos.x += parallax.x * 0.12
      tmpPos.y -= parallax.y * 0.07
    }
    camera.position.copy(tmpPos)
    camera.lookAt(tmpLook)
    sceneState.focus.copy(tmpLook)

    const aspect = size.width / size.height
    const fov = aspect < 0.8 ? 52 : aspect < 1.2 ? 44 : 35
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    // atmosphere: espresso darkness → porcelain light at renewal
    const light = smooth(W.renewal.start + 0.02, 0.985, p)
    if (light < 0.5) bg.copy(DARK).lerp(UMBER, light * 2)
    else bg.copy(UMBER).lerp(PORCELAIN, (light - 0.5) * 2)
    sceneState.fog.copy(bg)
    scene.background = bg
    const deep = smooth(W.dermis.end - 0.02, W.laser.start + 0.02, p)
    sceneState.fogNear = THREE.MathUtils.lerp(2.2, 5.5, deep) + light * 2
    sceneState.fogFar = THREE.MathUtils.lerp(9, 15, deep) + light * 6

    // chromatic aberration pulse only around transitions (+ a hint from scroll speed)
    let pulse = 0
    for (const tb of transitions) pulse = Math.max(pulse, Math.exp(-Math.pow((p - tb) / 0.014, 2)))
    const vel = Math.min(Math.abs(journey.velocity) * 0.004, 0.25)
    sceneState.transition = journey.reduced ? 0 : Math.min(1, pulse + vel)
  })
  return null
}
