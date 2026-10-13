import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { BG, Controls, Floor, ResponsiveCamera, Studio } from './stage.jsx'
import XCar from './vehicle/XCar.jsx'

/** 3D showroom for the BMW X family: the selected model drives onto the turntable. */
export default function XScene({ modelId, paint, active = true, autoRotate = true }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: [6.9, 2.1, 7.6], fov: 32, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-label="Interactive 3D model of the selected BMW X model"
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 11, 26]} />
      <ResponsiveCamera hfovWide={38} hfovNarrow={36} offsetWide={[0.06, -0.04]} offsetNarrow={[0, 0.04]} />
      <ambientLight intensity={0.25} />
      <spotLight position={[0, 9, 2]} angle={0.5} penumbra={1} intensity={120} decay={1.6} />
      <directionalLight position={[-4, 6, -3]} intensity={0.6} />
      <Suspense fallback={null}>
        <XCar key={modelId} id={modelId} paint={paint} />
      </Suspense>
      <ContactShadows key={modelId} position={[0, 0.002, 0]} scale={12} far={1.8} blur={2.4} opacity={0.85} resolution={512} frames={100} />
      <Floor ring={3.7} />
      <Studio />
      <Controls autoRotate={autoRotate} target={[0, 0.7, 0]} />
    </Canvas>
  )
}
