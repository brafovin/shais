import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Studio } from './stage.jsx'
import XCar from './vehicle/XCar.jsx'
import RealM4, { ModelErrorBoundary } from './RealM4.jsx'
import ProceduralM4 from './ProceduralM4.jsx'
import { PAINTS } from '../data/paints.js'

/** Compact, slowly turning 3D view of a model (used in the details dialog). */
export default function ModelViewer({ modelId }) {
  const isM4 = modelId === 'm4-competition'
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [5.6, 1.7, 6.2], fov: 30 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[-4, 6, -3]} intensity={0.7} />
      <Suspense fallback={null}>
        {isM4 ? (
          <ModelErrorBoundary fallback={<ProceduralM4 paint={PAINTS[0]} />}>
            <RealM4 paint={PAINTS[0]} />
          </ModelErrorBoundary>
        ) : (
          <XCar id={modelId} driveIn={false} />
        )}
      </Suspense>
      <ContactShadows position={[0, 0.002, 0]} scale={11} far={1.8} blur={2.2} opacity={0.75} resolution={512} frames={1} />
      <Studio />
      <OrbitControls
        target={[0, 0.65, 0]}
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.9}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.48}
      />
    </Canvas>
  )
}
