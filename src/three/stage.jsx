import { useEffect, useLayoutEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Environment, Lightformer, MeshReflectorMaterial, OrbitControls } from '@react-three/drei'

/* Shared studio set used by the M4 header and the X family showroom. */

export const BG = '#08090b'

/** Studio light rig rendered once into an environment map: gives the paint its reflections. */
export function Studio() {
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

export function Floor({ ring = 3.42 }) {
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
        <ringGeometry args={[ring, ring + 0.03, 160]} />
        <meshBasicMaterial color="#2f7bff" toneMapped={false} transparent opacity={0.7} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.002}>
        <ringGeometry args={[ring + 0.13, ring + 0.14, 160]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
      </mesh>
    </>
  )
}

/**
 * Keeps the whole car in frame on any aspect ratio and nudges it to the
 * right on wide screens so it doesn't sit under the headline.
 */
export function ResponsiveCamera({ hfovWide = 46, hfovNarrow = 34, offsetWide = [-0.1, -0.08], offsetNarrow = [0, 0.07] }) {
  const { camera, size } = useThree()
  useLayoutEffect(() => {
    const aspect = size.width / size.height
    const wide = aspect > 1.15
    // Horizontal field of view that fits the car; tighter on portrait screens.
    const hfov = ((wide ? hfovWide : hfovNarrow) * Math.PI) / 180
    const vfov = 2 * Math.atan(Math.tan(hfov / 2) / aspect)
    camera.fov = Math.min(62, Math.max(24, (vfov * 180) / Math.PI))
    const [ox, oy] = wide ? offsetWide : offsetNarrow
    camera.setViewOffset(size.width, size.height, ox * size.width, oy * size.height, size.width, size.height)
    camera.updateProjectionMatrix()
  }, [camera, size, hfovWide, hfovNarrow, offsetWide, offsetNarrow])
  return null
}

export function Controls({ autoRotate, target = [0, 0.55, 0] }) {
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
      target={target}
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
