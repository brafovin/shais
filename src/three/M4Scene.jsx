import { Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial, OrbitControls } from '@react-three/drei'
import ProceduralM4 from './ProceduralM4.jsx'
import ExternalCar, { ModelErrorBoundary, useOptionalModel } from './ExternalCar.jsx'

const BG = '#08090b'

/** Studio light rig rendered once into an environment map: gives the paint its reflections. */
function Studio() {
  return (
    <Environment resolution={512} frames={1}>
      <color attach="background" args={['#0c0d10']} />
      {/* overhead soft box */}
      <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 3.5, 1]} />
      {/* ceiling strips → long highlights along the shoulders */}
      {[-3, 0, 3].map((x) => (
        <Lightformer key={x} form="rect" intensity={2.2} position={[x, 5, -1]} rotation-x={Math.PI / 2} scale={[0.6, 10, 1]} />
      ))}
      {/* side panels */}
      <Lightformer form="rect" intensity={1.6} position={[-8, 2, 0]} rotation-y={Math.PI / 2} scale={[16, 2.2, 1]} />
      <Lightformer form="rect" intensity={1.6} position={[8, 2, 0]} rotation-y={-Math.PI / 2} scale={[16, 2.2, 1]} />
      {/* cool and warm accents */}
      <Lightformer form="ring" color="#4b8bff" intensity={4} position={[6, 3, -6]} scale={3} />
      <Lightformer form="rect" color="#ffd7a8" intensity={1.4} position={[-6, 1.5, 6]} scale={[4, 1.5, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1} position={[0, 1, 10]} scale={[14, 1, 1]} />
    </Environment>
  )
}

function Floor() {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.001}>
        <circleGeometry args={[30, 64]} />
        <MeshReflectorMaterial
          blur={[400, 120]}
          resolution={1024}
          mixBlur={1}
          mixStrength={22}
          roughness={1}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color="#0d0e11"
          metalness={0.6}
        />
      </mesh>
      {/* turntable outline */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.002}>
        <ringGeometry args={[3.42, 3.45, 160]} />
        <meshBasicMaterial color="#2f7bff" toneMapped={false} transparent opacity={0.7} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.002}>
        <ringGeometry args={[3.55, 3.56, 160]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
      </mesh>
    </>
  )
}

/**
 * Keeps the whole car in frame on any aspect ratio and nudges it to the
 * right on wide screens so it doesn't sit under the headline.
 */
function ResponsiveCamera() {
  const { camera, size } = useThree()
  useLayoutEffect(() => {
    const aspect = size.width / size.height
    const wide = aspect > 1.15
    // Horizontal field of view that fits the car; tighter on portrait screens.
    const hfov = ((wide ? 46 : 34) * Math.PI) / 180
    const vfov = 2 * Math.atan(Math.tan(hfov / 2) / aspect)
    camera.fov = Math.min(62, Math.max(24, (vfov * 180) / Math.PI))
    camera.setViewOffset(
      size.width,
      size.height,
      wide ? -size.width * 0.1 : 0,
      wide ? -size.height * 0.08 : size.height * 0.07,
      size.width,
      size.height,
    )
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

function Controls({ autoRotate }) {
  const ref = useRef()
  useEffect(() => {
    // Let vertical swipes scroll the page on touch screens; horizontal drags rotate.
    const el = ref.current?.domElement
    if (el) el.style.touchAction = 'pan-y'
  })
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      target={[0, 0.55, 0]}
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.08}
      autoRotate={autoRotate}
      autoRotateSpeed={0.55}
      minPolarAngle={Math.PI * 0.28}
      maxPolarAngle={Math.PI * 0.485}
    />
  )
}

function Car({ paint }) {
  const availability = useOptionalModel()
  const procedural = <ProceduralM4 paint={paint} />
  if (availability !== 'available') return procedural
  return (
    <ModelErrorBoundary fallback={procedural}>
      <Suspense fallback={procedural}>
        <ExternalCar paint={paint} />
      </Suspense>
    </ModelErrorBoundary>
  )
}

export default function M4Scene({ paint, active = true, autoRotate = true }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: [6.6, 1.9, 7.4], fov: 32, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-label="Interactive 3D model of the BMW M4 Competition"
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 10, 24]} />
      <ResponsiveCamera />
      <ambientLight intensity={0.25} />
      <spotLight position={[0, 9, 2]} angle={0.5} penumbra={1} intensity={120} decay={1.6} color="#ffffff" />
      <directionalLight position={[-4, 6, -3]} intensity={0.6} />

      <Car paint={paint} />

      <ContactShadows position={[0, 0.002, 0]} scale={11} far={1.4} blur={2.4} opacity={0.85} resolution={512} frames={1} />
      <Floor />
      <Studio />
      <Controls autoRotate={autoRotate} />
    </Canvas>
  )
}
