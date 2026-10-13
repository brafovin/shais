import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, useProgress } from '@react-three/drei'
import { BG, Controls, Floor, ResponsiveCamera, Studio } from './stage.jsx'
import ProceduralM4 from './ProceduralM4.jsx'
import RealM4, { ModelErrorBoundary } from './RealM4.jsx'

function Car({ paint }) {
  return (
    <ModelErrorBoundary fallback={<ProceduralM4 paint={paint} />}>
      <Suspense fallback={null}>
        <RealM4 paint={paint} />
      </Suspense>
    </ModelErrorBoundary>
  )
}

/** Download progress of the 3D model, shown over the canvas. */
function LoadingOverlay() {
  const { active, progress } = useProgress()
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    if (active) setVisible(true)
    else if (progress >= 100) {
      const t = setTimeout(() => setVisible(false), 250)
      return () => clearTimeout(t)
    }
  }, [active, progress])
  if (!visible) return null
  return (
    <div className={`scene-loader ${active ? '' : 'scene-loader--done'}`} role="status">
      <span className="scene-loader__label">Loading M4 Competition</span>
      <span className="scene-loader__bar">
        <span style={{ transform: `scaleX(${Math.max(0.04, progress / 100)})` }} />
      </span>
      <span className="scene-loader__pct">{Math.round(progress)}%</span>
    </div>
  )
}

export default function M4Scene({ paint, active = true, autoRotate = true }) {
  return (
    <>
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
    <LoadingOverlay />
    </>
  )
}
