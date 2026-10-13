import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { buildCarGeometry, DIM, noseX, sideZ, tailX } from './carShape.js'
import { createMaterials } from './materials.js'
import Wheel from './Wheel.jsx'

/* Kidney grille: tall rounded slab with a gloss frame and horizontal slats. */
function kidneyGeometry() {
  const w = 0.2
  const h = 0.4
  const r = 0.065
  const s = new THREE.Shape()
  s.moveTo(-w / 2 + r, -h / 2)
  s.lineTo(w / 2 - r, -h / 2)
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
  s.lineTo(w / 2, h / 2 - r)
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
  s.lineTo(-w / 2 + r, h / 2)
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
  s.lineTo(-w / 2, -h / 2 + r)
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
  const depth = 0.1
  const bevel = 0.014
  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 12,
  })
  g.translate(0, 0, -depth - bevel)
  return g
}

function Kidneys({ materials }) {
  const geometry = useMemo(kidneyGeometry, [])
  return [1, -1].map((side) => {
    const z = side * 0.135
    const yc = 0.46
    const xTop = noseX(0.64, z)
    const xBot = noseX(0.28, z)
    const rake = Math.atan2(xBot - xTop, 0.36)
    return (
      <group key={side} position={[noseX(yc, z) + 0.012, yc, z]} rotation-z={rake}>
        <mesh geometry={geometry} material={[materials.kidneySlats, materials.kidneyFrame]} rotation-y={Math.PI / 2} />
      </group>
    )
  })
}

function Mirrors({ materials }) {
  return [1, -1].map((side) => {
    const x = 0.4
    const zBase = sideZ(x, 0.9)
    return (
      <group key={side} position={[x, 1.0, side * (zBase + 0.1)]}>
        <RoundedBox args={[0.13, 0.11, 0.21]} radius={0.04} smoothness={4} material={materials.paint} />
        <mesh position={[-0.066, 0, 0]} rotation-y={-Math.PI / 2} material={materials.mirror}>
          <planeGeometry args={[0.17, 0.08]} />
        </mesh>
        <mesh position={[0.01, -0.05, -side * 0.1]} material={materials.gloss}>
          <boxGeometry args={[0.07, 0.022, 0.12]} />
        </mesh>
      </group>
    )
  })
}

function Exhausts({ materials }) {
  const y = 0.3
  return [-0.47, -0.34, 0.34, 0.47].map((z) => (
    <group key={z} position={[tailX(y, z) + 0.02, y, z]} rotation-z={Math.PI / 2}>
      <mesh material={materials.exhaust}>
        <cylinderGeometry args={[0.046, 0.046, 0.14, 32, 1, true]} />
      </mesh>
      <mesh position={[0, -0.03, 0]} rotation-x={-Math.PI / 2} material={materials.matte}>
        <circleGeometry args={[0.044, 24]} />
      </mesh>
    </group>
  ))
}

/** Dark half-cylinders that line the wheel arches, plus the floor pan. */
function WheelWells({ materials }) {
  return (
    <>
      {[DIM.frontAxle, DIM.rearAxle].map((x) => (
        <mesh key={x} position={[x, DIM.archCY, 0]} rotation-x={Math.PI / 2} material={materials.wells}>
          <cylinderGeometry args={[DIM.archR - 0.006, DIM.archR - 0.006, 1.84, 40, 1, true, Math.PI / 2, Math.PI]} />
        </mesh>
      ))}
      <mesh position={[0.02, 0.36, 0]} material={materials.wells}>
        <boxGeometry args={[3.95, 0.42, 1.3]} />
      </mesh>
    </>
  )
}

/**
 * Fully procedural BMW M4 Competition. `paint` is one of PAINTS.
 */
export default function ProceduralM4({ paint }) {
  const geo = useMemo(buildCarGeometry, [])
  const materials = useMemo(createMaterials, [])
  const target = useRef(new THREE.Color(paint.hex))

  useEffect(() => {
    target.current.set(paint.hex)
    materials.paint.metalness = paint.metallic ? 0.55 : 0.15
    materials.paint.roughness = paint.metallic ? 0.26 : 0.32
  }, [paint, materials])

  // Smoothly blend to the new paint colour.
  useFrame((_, dt) => {
    materials.paint.color.lerp(target.current, 1 - Math.exp(-dt * 6))
  })

  const m = materials
  return (
    <group>
      <mesh geometry={geo.body} material={m.paint} />
      <mesh geometry={geo.cabin} material={m.paint} />
      <mesh geometry={geo.wells} material={m.wells} />
      <mesh geometry={geo.glass} material={m.glass} />
      <mesh geometry={geo.roof} material={m.roof} />
      <mesh geometry={geo.gloss} material={m.gloss} />
      <mesh geometry={geo.matte} material={m.matte} />
      <mesh geometry={geo.carbon} material={m.carbon} />
      <mesh geometry={geo.headGlass} material={m.headGlass} />
      <mesh geometry={geo.drl} material={m.drl} />
      <mesh geometry={geo.laser} material={m.laser} />
      <mesh geometry={geo.tailGlass} material={m.tailGlass} />
      <mesh geometry={geo.tailLight} material={m.tailLight} />
      <Kidneys materials={m} />
      <Mirrors materials={m} />
      <Exhausts materials={m} />
      <WheelWells materials={m} />
      {[DIM.frontAxle, DIM.rearAxle].flatMap((x) =>
        [1, -1].map((side) => (
          <Wheel key={`${x}${side}`} position={[x, DIM.wheelR, side * DIM.track]} side={side} materials={m} />
        )),
      )}
    </group>
  )
}
