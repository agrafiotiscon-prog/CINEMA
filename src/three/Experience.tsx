import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { CameraRig } from './CameraRig'
import { SkinSurface } from './SkinSurface'
import { Droplet } from './Droplet'
import { Epidermis } from './Epidermis'
import { Collagen } from './Collagen'
import { Hyaluronic } from './Hyaluronic'
import { TreatmentStage } from './TreatmentStage'
import { Post } from './Post'
import { sceneState } from './sceneState'
import type { Tier } from '../lib/journeyState'

const DPR: Record<Tier, [number, number]> = { high: [1, 2], medium: [1, 1.5], low: [1, 1.25] }
const down: Record<Tier, Tier> = { high: 'medium', medium: 'low', low: 'low' }
// ?quality=high|medium|low pins the tier (used for testing & art direction)
const forced = new URLSearchParams(location.search).has('quality')

function Ready({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const frames = useRef(0)
  const compiled = useRef(false)
  const sent = useRef(false)
  useEffect(() => {
    let alive = true
    const done = () => alive && (compiled.current = true)
    const r = gl as THREE.WebGLRenderer & { compileAsync?: (s: THREE.Scene, c: THREE.Camera) => Promise<unknown> }
    if (r.compileAsync) r.compileAsync(scene, camera).then(done, done)
    else done()
    return () => {
      alive = false
    }
  }, [gl, scene, camera])
  useFrame(() => {
    frames.current++
    if (!sent.current && compiled.current && frames.current > 4) {
      sent.current = true
      onReady()
    }
  })
  return null
}

function Studio() {
  // Procedural studio environment (no HDR downloads): softboxes + warm rim strips.
  return (
    <Environment resolution={128} frames={1}>
      <color attach="background" args={['#0d0908']} />
      <Lightformer form="rect" intensity={2.4} position={[0, 5, -2]} scale={[8, 3, 1]} rotation-x={Math.PI / 2} color="#fff1e8" />
      <Lightformer form="rect" intensity={3} position={[-5, 2, -4]} scale={[2, 6, 1]} rotation-y={Math.PI / 3} color="#ffd9c4" />
      <Lightformer form="rect" intensity={1.2} position={[5, 1, 3]} scale={[3, 3, 1]} rotation-y={-Math.PI / 2.5} color="#e7b79b" />
      <Lightformer form="ring" intensity={1.5} position={[0, 3, 5]} scale={2} color="#ffffff" />
    </Environment>
  )
}

export default function Experience({
  initialTier,
  active,
  onReady,
  onFail,
}: {
  initialTier: Tier
  active: boolean
  onReady: () => void
  onFail: () => void
}) {
  const [tier, setTier] = useState<Tier>(initialTier)
  sceneState.tier = tier

  return (
    <Canvas
      dpr={DPR[tier]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 35, near: 0.02, far: 60, position: [0, 1.15, 2.7] }}
      gl={{ antialias: tier === 'low', powerPreference: 'high-performance', alpha: false, stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onFail()
        })
      }}
      aria-hidden="true"
      tabIndex={-1}
    >
      {!forced && (
        <PerformanceMonitor
          flipflops={2}
          bounds={(refresh) => (refresh > 90 ? [50, 90] : [42, 58])}
          onDecline={() => setTier((t) => down[t])}
        />
      )}
      <color attach="background" args={['#0d0908']} />
      <Studio />
      <ambientLight intensity={0.15} />
      <directionalLight position={[-3, 4, -3]} intensity={2.2} color="#ffe9dc" />
      <directionalLight position={[3, 2, 4]} intensity={0.5} color="#e7b79b" />

      <SkinSurface tier={tier} />
      <Droplet tier={tier} />
      <Epidermis tier={tier} />
      <Collagen tier={tier} />
      <Hyaluronic tier={tier} />
      <TreatmentStage tier={tier} />
      <CameraRig />
      {tier !== 'low' && <Post tier={tier} />}
      <Ready onReady={onReady} />
    </Canvas>
  )
}
