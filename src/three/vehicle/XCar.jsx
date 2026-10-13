import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createBody } from './body.js'
import { clean } from './kit.js'
import { wheelGeometry } from './parts.js'
import { X_SPECS } from './specs.js'

/* ------------------------------------------------------------------ */
/* Geometry (built once per model, then cached)                         */
/* ------------------------------------------------------------------ */

const cache = new Map()

export function buildXGeometry(id) {
  if (cache.has(id)) return cache.get(id)
  const spec = X_SPECS[id]
  const body = createBody(spec)
  const groups = {}
  const add = (key, g) => (groups[key] ??= []).push(clean(g))
  const shell = body.buildBody()
  spec.details(body, add)
  spec.front(body, add)
  spec.rear(body, add)
  const parts = Object.fromEntries(Object.entries(groups).map(([k, list]) => [k, mergeGeometries(list)]))
  const out = {
    spec,
    shell: shell.paint,
    wells: shell.wells,
    cabin: body.buildCabin(),
    parts,
    wheel: wheelGeometry({ R: spec.R, width: spec.tireW, rimR: spec.rimR, style: spec.wheel }),
  }
  cache.set(id, out)
  return out
}

/* ------------------------------------------------------------------ */
/* Textures                                                             */
/* ------------------------------------------------------------------ */

function canvasTexture(w, h, draw, repeat = [1, 1]) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  draw(canvas.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.repeat.set(...repeat)
  return tex
}

const TEXTURES = {
  // Vertical kidney bars (UVs of the grille are in metres).
  barsV: () =>
    canvasTexture(
      64,
      8,
      (c, w, h) => {
        c.fillStyle = '#030304'
        c.fillRect(0, 0, w, h)
        const g = c.createLinearGradient(16, 0, 48, 0)
        g.addColorStop(0, '#0d0e10')
        g.addColorStop(0.5, '#5a5f66')
        g.addColorStop(1, '#0d0e10')
        c.fillStyle = g
        c.fillRect(16, 0, 32, h)
      },
      [1 / 0.032, 1],
    ),
  diamond: () =>
    canvasTexture(
      64,
      64,
      (c, w, h) => {
        c.fillStyle = '#040405'
        c.fillRect(0, 0, w, h)
        c.strokeStyle = '#6b7078'
        c.lineWidth = 7
        c.beginPath()
        c.moveTo(0, h / 2)
        c.lineTo(w / 2, 0)
        c.lineTo(w, h / 2)
        c.lineTo(w / 2, h)
        c.closePath()
        c.stroke()
      },
      [1 / 0.04, 1 / 0.04],
    ),
  diagonal: () =>
    canvasTexture(
      64,
      64,
      (c, w, h) => {
        c.fillStyle = '#050506'
        c.fillRect(0, 0, w, h)
        c.strokeStyle = '#3c4047'
        c.lineWidth = 10
        for (let i = -1; i <= 1; i++) {
          c.beginPath()
          c.moveTo(i * w, h)
          c.lineTo(i * w + w, 0)
          c.stroke()
        }
      },
      [1 / 0.035, 1 / 0.035],
    ),
  gloss: () => null,
  honeycomb: () =>
    canvasTexture(
      60,
      52,
      (c, w, h) => {
        c.fillStyle = '#020203'
        c.fillRect(0, 0, w, h)
        c.strokeStyle = '#2b2e33'
        c.lineWidth = 3
        const hex = (cx, cy, r) => {
          c.beginPath()
          for (let k = 0; k < 6; k++) {
            const a = (Math.PI / 3) * k
            c.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
          }
          c.closePath()
          c.stroke()
        }
        hex(15, 13, 13)
        hex(45, 39, 13)
        hex(45, -13, 13)
        hex(-15, 39, 13)
        hex(75, 39, 13)
        hex(15, 65, 13)
      },
      [26, 5],
    ),
}

/* ------------------------------------------------------------------ */
/* Materials                                                            */
/* ------------------------------------------------------------------ */

function createMaterials(spec) {
  const paint = new THREE.MeshPhysicalMaterial({
    color: spec.paint.hex,
    metalness: spec.paint.matte ? 0.45 : spec.paint.metallic ? 0.55 : 0.12,
    roughness: spec.paint.matte ? 0.52 : spec.paint.metallic ? 0.26 : 0.3,
    clearcoat: spec.paint.matte ? 0.05 : 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.25,
  })
  const grilleMap = TEXTURES[spec.grilleTexture]?.()
  const black = new THREE.MeshPhysicalMaterial({
    color: '#0a0b0d',
    metalness: 0.2,
    roughness: 0.32,
    clearcoat: 0.5,
    clearcoatRoughness: 0.25,
    envMapIntensity: 0.45,
  })
  return {
    paint,
    black,
    wells: new THREE.MeshStandardMaterial({
      color: '#050505',
      roughness: 0.95,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 2,
    }),
    gap: new THREE.MeshBasicMaterial({ color: '#050506' }),
    trim: new THREE.MeshStandardMaterial({ color: '#25282d', metalness: 0.2, roughness: 0.6, envMapIntensity: 0.5 }),
    mesh: new THREE.MeshStandardMaterial({ map: TEXTURES.honeycomb(), metalness: 0.3, roughness: 0.6 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#c7ccd2', metalness: 1, roughness: 0.18, envMapIntensity: 0.8 }),
    chromeDS: new THREE.MeshStandardMaterial({ color: '#c9cdd2', metalness: 1, roughness: 0.18, side: THREE.DoubleSide }),
    bronze: new THREE.MeshStandardMaterial({ color: '#b08d57', metalness: 1, roughness: 0.25 }),
    mirror: new THREE.MeshStandardMaterial({ color: '#a8b3bd', metalness: 1, roughness: 0.03 }),
    badgeBlue: new THREE.MeshStandardMaterial({ color: '#1c69d4', roughness: 0.3 }),
    badgeWhite: new THREE.MeshStandardMaterial({ color: '#f4f6f8', roughness: 0.3 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#05070a', metalness: 0.2, roughness: 0.05, clearcoat: 1, envMapIntensity: 0.6 }),
    grille: new THREE.MeshPhysicalMaterial({
      color: grilleMap ? '#ffffff' : '#050607',
      map: grilleMap ?? null,
      metalness: 0.35,
      roughness: grilleMap ? 0.45 : 0.18,
      clearcoat: grilleMap ? 0 : 0.6,
      envMapIntensity: grilleMap ? 0.5 : 0.35,
    }),
    lamp: new THREE.MeshPhysicalMaterial({ color: '#0b0f15', metalness: 0.6, roughness: 0.12, clearcoat: 1, envMapIntensity: 0.7 }),
    lampGlass: new THREE.MeshPhysicalMaterial({ color: '#202833', metalness: 0.9, roughness: 0.1, clearcoat: 1 }),
    drl: new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#eaf6ff', emissiveIntensity: 3.2, toneMapped: false }),
    tailGlass: new THREE.MeshPhysicalMaterial({ color: '#2a0303', emissive: '#3a0000', emissiveIntensity: 0.7, metalness: 0.3, roughness: 0.08, clearcoat: 1 }),
    tail: new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#ff1a1a', emissiveIntensity: 3, toneMapped: false }),
    tire: new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.92 }),
    rim: new THREE.MeshPhysicalMaterial({ color: spec.rim.color, metalness: 0.8, roughness: 0.32, clearcoat: 0.5 }),
    rimFace: new THREE.MeshStandardMaterial({ color: spec.rim.face ?? spec.rim.color, metalness: 1, roughness: 0.22 }),
    rimInner: new THREE.MeshStandardMaterial({ color: '#1a1b1e', metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide }),
    disc: new THREE.MeshStandardMaterial({ color: '#8d9095', metalness: 0.9, roughness: 0.42 }),
    caliper: new THREE.MeshPhysicalMaterial({ color: spec.caliper, roughness: 0.35, clearcoat: 1 }),
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

function Wheel({ geo, m, position, side, spinRef }) {
  const caliperAngle = side > 0 ? Math.PI * 0.72 : Math.PI * 0.28
  return (
    <group position={position} rotation-y={side > 0 ? 0 : Math.PI}>
      <group ref={spinRef}>
        <mesh geometry={geo.tire} material={m.tire} />
        <mesh geometry={geo.rim} material={m.rim} />
        {geo.face && <mesh geometry={geo.face} material={m.rimFace} />}
        <mesh geometry={geo.inner} material={m.rimInner} />
        <mesh geometry={geo.cap} material={m.black} />
        <mesh geometry={geo.disc} material={m.disc} />
      </group>
      <mesh geometry={geo.caliper} material={m.caliper} rotation-z={caliperAngle} />
    </group>
  )
}

const easeOut = (t) => 1 - (1 - t) ** 3

/**
 * A procedurally modelled BMW X model. `paint` (optional) overrides the
 * default colour. With `driveIn` the car rolls into place when mounted.
 */
export default function XCar({ id, paint, driveIn = true }) {
  const geo = useMemo(() => buildXGeometry(id), [id])
  const m = useMemo(() => createMaterials(geo.spec), [geo])
  const target = useRef(new THREE.Color(paint?.hex ?? geo.spec.paint.hex))
  const root = useRef()
  const spins = useRef([])
  const t = useRef(driveIn ? 0 : 1)

  useEffect(() => {
    const p = paint ?? geo.spec.paint
    target.current.set(p.hex)
    if (!geo.spec.paint.matte) {
      m.paint.metalness = p.metallic ? 0.55 : 0.12
      m.paint.roughness = p.metallic ? 0.26 : 0.3
    }
  }, [paint, geo, m])

  useFrame((_, dt) => {
    m.paint.color.lerp(target.current, 1 - Math.exp(-dt * 6))
    if (t.current < 1) {
      t.current = Math.min(1, t.current + dt / 1.3)
      const x = -7 * (1 - easeOut(t.current))
      root.current.position.x = x
      spins.current.forEach((g, i) => g && (g.rotation.z = ((i % 2 ? 1 : -1) * x) / geo.spec.R))
    }
  })

  const S = geo.spec
  const wheels = [S.frontAxle, S.rearAxle].flatMap((x) => [1, -1].map((side) => ({ x, side })))
  return (
    <group ref={root} position-x={driveIn ? -7 : 0}>
      <mesh geometry={geo.shell} material={m.paint} />
      <mesh geometry={geo.cabin} material={m.paint} />
      <mesh geometry={geo.wells} material={m.wells} />
      {Object.entries(geo.parts).map(([key, g]) => (
        <mesh key={key} geometry={g} material={m[key] ?? m.black} />
      ))}
      {[S.frontAxle, S.rearAxle].map((x) => (
        <mesh key={x} position={[x, S.archCY, 0]} rotation-x={Math.PI / 2} material={m.wells}>
          <cylinderGeometry args={[S.archR - 0.006, S.archR - 0.006, S.layout.W * 1.9, 40, 1, true, Math.PI / 2, Math.PI]} />
        </mesh>
      ))}
      <mesh position={[0, S.layout.clear + 0.2, 0]} material={m.wells}>
        <boxGeometry args={[S.length - 0.9, 0.38, S.layout.W * 1.4]} />
      </mesh>
      {wheels.map(({ x, side }, i) => (
        <Wheel
          key={`${x}${side}`}
          geo={geo.wheel}
          m={m}
          side={side}
          position={[x, S.R, side * S.track]}
          spinRef={(el) => (spins.current[i] = el)}
        />
      ))}
    </group>
  )
}
