import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { createSkinMaterial } from './shaders/skin'
import { noiseGLSL } from './shaders/noise'
import { counts, sceneState } from './sceneState'
import { W, local, presence, smooth } from '../lib/timeline'
import type { Tier } from '../lib/journeyState'

export const STAGE = new THREE.Vector3(0, -10.2, 0)
const SIZE = 4
const DEPTH = 1.6

/* ---------- cross-section sides (epidermis / dermis / hypodermis) ---------- */
const strataVert = /* glsl */ `
varying vec2 vUv; varying vec3 vWorld; varying vec3 vN;
void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.0); vWorld = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * wp; }
`
const strataFrag = /* glsl */ `
uniform float uImprove; uniform float uRenew; uniform float uOpacity; uniform float uTime;
uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar;
varying vec2 vUv; varying vec3 vWorld; varying vec3 vN;
${noiseGLSL}
void main(){
  float y = (1.0 - vUv.y) * ${DEPTH.toFixed(2)};
  float x = vUv.x * ${SIZE.toFixed(1)};
  float wave = 0.035 * sin(x * 7.0) + 0.02 * sin(x * 13.0 + 1.0);
  float epiEnd = 0.16 + wave;
  float derEnd = 1.02 + 0.05 * sin(x * 2.0);
  vec3 epi = vec3(0.93, 0.78, 0.70);
  vec3 der = vec3(0.66, 0.33, 0.29);
  vec3 hyp = vec3(0.86, 0.70, 0.44);
  vec3 col;
  float glow = 0.0;
  if (y < epiEnd) {
    vec2 v = voronoi(vec2(x * 22.0, y * 40.0));
    col = epi * (0.75 + 0.25 * smoothstep(0.0, 0.25, v.y - v.x));
    col *= mix(1.0, 0.82, smoothstep(epiEnd - 0.04, epiEnd, y));
  } else if (y < derEnd) {
    float chaos = 1.0 - uImprove;
    vec2 q = vec2(x * 3.0, y * 16.0 + chaos * 1.8 * fbm(vec2(x * 2.0, y * 3.0)));
    float fib = smoothstep(0.35, 0.75, fbm(vec2(q.x * 1.2, q.y)));
    float ordered = smoothstep(0.4, 0.6, 0.5 + 0.5 * sin(y * 70.0 + sin(x * 9.0) * 0.6));
    fib = mix(fib, ordered, uImprove * 0.65);
    col = der * (0.55 + 0.6 * fib);
    glow = fib * 0.12 * (0.4 + uImprove);
  } else {
    vec2 v = voronoi(vec2(x * 6.0, y * 7.0));
    float edge = 1.0 - smoothstep(0.0, 0.06, v.y - v.x);
    col = hyp * (0.55 + 0.25 * v.x) + vec3(0.9, 0.6, 0.45) * edge * 0.25;
  }
  float topLine = exp(-pow((y - 0.004) * 60.0, 2.0));
  col += vec3(1.0, 0.86, 0.76) * topLine * 0.35;
  col *= 0.5 + 0.5 * smoothstep(${DEPTH.toFixed(2)}, 0.0, y);
  col += vec3(0.906, 0.718, 0.608) * glow;
  col = mix(col, col * 0.8 + vec3(0.96, 0.92, 0.89) * 0.18, uRenew);
  float d = length(cameraPosition - vWorld);
  col = mix(col, uFogColor, smoothstep(uFogNear, uFogFar, d));
  gl_FragColor = vec4(col, uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/* ---------- laser light sheet ---------- */
const sheetVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`
const sheetFrag = /* glsl */ `
uniform float uAmt; uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
void main(){
  float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
  float fall = pow(1.0 - vUv.y, 3.0);
  float shimmer = 0.85 + 0.15 * sin(vUv.x * 80.0 + uTime * 9.0) * sin(vUv.y * 30.0 - uTime * 4.0);
  float a = edge * fall * shimmer * uAmt * 0.32;
  gl_FragColor = vec4(uColor * a, 1.0);
  #include <colorspace_fragment>
}
`

/* ---------- peel particles (released where the noise threshold passes) ---------- */
const peelVert = /* glsl */ `
attribute float aSeed;
uniform float uPeel; uniform float uAmt; uniform float uPixelRatio; uniform float uTime;
varying float vA;
${noiseGLSL}
void main(){
  vec2 p = position.xz;
  float pn = fbm(p * 1.4 + 2.0);
  float age = (uPeel * 1.15 - 0.05) - pn;
  vec3 pos = position;
  float s = aSeed * 30.0;
  float rise = max(age, 0.0);
  pos.y += rise * (2.2 + aSeed * 1.6);
  pos.x += sin(rise * 6.0 + s) * rise * 0.5;
  pos.z += cos(rise * 5.0 + s) * rise * 0.5;
  vA = smoothstep(0.0, 0.02, age) * (1.0 - smoothstep(0.12, 0.42, age)) * uAmt;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = (6.0 + aSeed * 10.0) * uPixelRatio / max(-mv.z, 0.1);
  gl_Position = projectionMatrix * mv;
}
`
const peelFrag = /* glsl */ `
uniform vec3 uColor; varying float vA;
void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.1, d) * vA; if (a < 0.004) discard; gl_FragColor = vec4(uColor * a, 1.0);
  #include <colorspace_fragment>
}
`

export function TreatmentStage({ tier }: { tier: Tier }) {
  const group = useRef<THREE.Group>(null)
  const sheet = useRef<THREE.Mesh>(null)
  const bar = useRef<THREE.Mesh>(null)
  const device = useRef<THREE.Group>(null)
  const bead = useRef<THREE.Mesh>(null)
  const dpr = useThree((s) => s.viewport.dpr)
  const { stageSeg, k } = counts(tier)

  const topGeo = useMemo(() => new THREE.PlaneGeometry(SIZE, SIZE, stageSeg, stageSeg), [stageSeg])
  const topMat = useMemo(() => {
    const m = createSkinMaterial({ treatment: true })
    m.uniforms.uScale.value = 5.5
    m.uniforms.uBump.value = 0.012
    m.uniforms.uPool.value.set(0, 0, 0)
    m.uniforms.uPoolR.value = 3.2
    m.uniforms.uMacro.value = 0.35
    m.uniforms.uFogNear.value = 5
    m.uniforms.uFogFar.value = 14
    m.uniforms.uKeyDir.value.set(-0.5, 0.75, -0.55)
    return m
  }, [])
  const strataMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uImprove: { value: 0 },
          uRenew: { value: 0 },
          uOpacity: { value: 1 },
          uTime: { value: 0 },
          uFogColor: { value: new THREE.Color() },
          uFogNear: { value: 5 },
          uFogFar: { value: 14 },
        },
        vertexShader: strataVert,
        fragmentShader: strataFrag,
      }),
    [],
  )
  const sideGeo = useMemo(() => new THREE.PlaneGeometry(SIZE, DEPTH), [])
  const sheetMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uAmt: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color('#f2c1a4') } },
        vertexShader: sheetVert,
        fragmentShader: sheetFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  )
  const barMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9c2').multiplyScalar(3), transparent: true, toneMapped: false }), [])

  const metal = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#d9b8a3', metalness: 1, roughness: 0.22, transparent: true, envMapIntensity: 1.3 }),
    [],
  )
  const steel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f4efea', metalness: 1, roughness: 0.15, transparent: true, envMapIntensity: 1.5 }),
    [],
  )
  const plate = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#fbf3ec', metalness: 0, roughness: 0.1, transparent: true, opacity: 0.12, envMapIntensity: 1.2, depthWrite: false }),
    [],
  )
  const needles = useMemo(() => {
    const g = new THREE.ConeGeometry(0.009, 0.2, 8)
    g.rotateX(Math.PI)
    g.translate(0, -0.1, 0)
    return g
  }, [])
  const setNeedles = (m: THREE.InstancedMesh | null) => {
    if (!m || m.userData.placed) return
    const o = new THREE.Object3D()
    let i = 0
    for (let x = -4; x <= 4; x++)
      for (let z = -4; z <= 4; z++) {
        o.position.set(x / 6, 0, z / 6)
        o.updateMatrix()
        m.setMatrixAt(i++, o.matrix)
      }
    m.instanceMatrix.needsUpdate = true
    m.userData.placed = true
  }

  const peelGeo = useMemo(() => {
    const n = Math.round(3200 * k)
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * SIZE * 0.96
      pos[i * 3 + 1] = 0.01
      pos[i * 3 + 2] = (Math.random() - 0.5) * SIZE * 0.96
      seed[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [k])
  const peelMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uPeel: { value: 0 },
          uAmt: { value: 0 },
          uPixelRatio: { value: 1 },
          uTime: { value: 0 },
          uColor: { value: new THREE.Color('#f7dccb') },
        },
        vertexShader: peelVert,
        fragmentShader: peelFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  const beadMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe6d6').multiplyScalar(2.2), transparent: true, toneMapped: false }),
    [],
  )

  useFrame(() => {
    const p = sceneState.p
    const t = sceneState.time
    const vis = p > W.laser.start - 0.06
    if (group.current) group.current.visible = vis
    if (!vis) return

    const lp = local('laser', p)
    const laserX = smooth(0.06, 0.94, lp)
    const laserAmt = presence(W.laser.start, W.laser.end, p, 0.02, 0.02)
    const needle = presence(W.needling.start, W.needling.end, p, 0.025, 0.025)
    const np = local('needling', p)
    const peel = smooth(0.08, 0.92, local('peel', p))
    const peelAmt = presence(W.peel.start, W.peel.end, p, 0.02, 0.03)
    const vp = local('volume', p)
    const volume = smooth(0.25, 0.9, vp)
    const volAmt = presence(W.volume.start, W.volume.end, p, 0.02, 0.04)
    const renew = smooth(W.renewal.start, W.renewal.start + (W.renewal.end - W.renewal.start) * 0.55, p)
    const improve = 0.18 * smooth(0.15, 0.9, np) + 0.12 * volume + 0.25 * renew

    const u = topMat.uniforms
    u.uTime.value = t
    u.uLaserX.value = laserX
    u.uLaserAmt.value = laserAmt
    u.uNeedle.value = needle
    u.uNeedleTime.value = t
    u.uPeel.value = peel
    u.uPeelAmt.value = peelAmt
    u.uVolume.value = volume
    u.uVolumeAmt.value = volAmt
    u.uImprove.value = improve
    u.uRenew.value = renew
    u.uExposure.value = 1 + renew * 0.15
    u.uFogColor.value.copy(sceneState.fog)

    const s = strataMat.uniforms
    s.uImprove.value = Math.min(1, improve * 1.6 + laserX * 0.2 + peel * 0.15)
    s.uRenew.value = renew
    s.uFogColor.value.copy(sceneState.fog)

    // laser sheet + scanner bar follow the beam
    const bx = -2.2 + laserX * 4.4
    if (sheet.current) {
      sheet.current.visible = laserAmt > 0.001
      sheet.current.position.x = bx
    }
    sheetMat.uniforms.uAmt.value = laserAmt
    sheetMat.uniforms.uTime.value = t
    if (bar.current) {
      bar.current.visible = laserAmt > 0.001
      bar.current.position.x = bx
      barMat.opacity = laserAmt
    }

    // microneedling device taps the surface
    if (device.current) {
      device.current.visible = needle > 0.001
      const tap = 0.5 + 0.5 * Math.cos(t * 5.2)
      device.current.position.y = 0.2 + 0.12 * tap + (1 - needle) * 0.6
      device.current.rotation.y = t * 0.08
      metal.opacity = steel.opacity = needle
      plate.opacity = 0.12 * needle
    }

    peelMat.uniforms.uPeel.value = peel
    peelMat.uniforms.uAmt.value = peelAmt
    peelMat.uniforms.uPixelRatio.value = dpr

    if (bead.current) {
      const k2 = smooth(0.02, 0.32, vp)
      bead.current.visible = volAmt > 0.001 && k2 < 0.999
      bead.current.position.set(0.15, 0.9 - k2 * 0.95, 0)
      const sc = 0.035 * (1 - smooth(0.7, 1, k2))
      bead.current.scale.setScalar(Math.max(sc, 0.0001))
      beadMat.opacity = volAmt
    }
  })

  const half = SIZE / 2
  return (
    <group ref={group} position={STAGE}>
      <mesh geometry={topGeo} material={topMat} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false} />
      <mesh geometry={sideGeo} material={strataMat} position={[0, -DEPTH / 2, half]} />
      <mesh geometry={sideGeo} material={strataMat} position={[half, -DEPTH / 2, 0]} rotation={[0, Math.PI / 2, 0]} />
      <mesh geometry={sideGeo} material={strataMat} position={[0, -DEPTH / 2, -half]} rotation={[0, Math.PI, 0]} />
      <mesh geometry={sideGeo} material={strataMat} position={[-half, -DEPTH / 2, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* laser */}
      <mesh ref={sheet} material={sheetMat} position={[0, 1.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[SIZE * 1.02, 2.6]} />
      </mesh>
      <mesh ref={bar} material={barMat} position={[0, 2.6, 0]}>
        <boxGeometry args={[0.03, 0.03, SIZE * 1.05]} />
      </mesh>

      {/* microneedling */}
      <group ref={device}>
        <mesh material={metal} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.95, 0.014, 12, 96]} />
        </mesh>
        <mesh material={metal} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <torusGeometry args={[0.95, 0.006, 8, 96]} />
        </mesh>
        <mesh material={plate} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.94, 64]} />
        </mesh>
        <instancedMesh ref={setNeedles} args={[needles, steel, 81]} />
      </group>

      {/* peel */}
      <points geometry={peelGeo} material={peelMat} frustumCulled={false} />

      {/* injectable bead */}
      <mesh ref={bead} material={beadMat}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
    </group>
  )
}
