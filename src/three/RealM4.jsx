import { Component, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { M4_MODEL } from '../config.js'
import { buildAero } from './aero.js'

export class ModelErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    console.warn('[M4] Could not load the 3D model, using the procedural car instead.', error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Carbon-fibre twill drawn on a canvas. */
function carbonTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#0a0b0d'
  ctx.fillRect(0, 0, size, size)
  const cell = size / 4
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const horizontal = (i + j) % 2 === 0
      const g = horizontal
        ? ctx.createLinearGradient(0, j * cell, 0, (j + 1) * cell)
        : ctx.createLinearGradient(i * cell, 0, (i + 1) * cell, 0)
      g.addColorStop(0, '#0f1013')
      g.addColorStop(0.5, '#2b2e34')
      g.addColorStop(1, '#0f1013')
      ctx.fillStyle = g
      ctx.fillRect(i * cell + 1, j * cell + 1, cell - 2, cell - 2)
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(24, 24)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

const byName = (names) => (m) => names.includes(m.name)

/**
 * Bounding box of the vertices that are actually drawn. The model contains a
 * few unused vertices at its origin, which would throw off Box3.setFromObject.
 */
function drawnBox(object) {
  const box = new THREE.Box3()
  const v = new THREE.Vector3()
  object.updateWorldMatrix(true, true)
  object.traverse((mesh) => {
    if (!mesh.isMesh) return
    const pos = mesh.geometry.attributes.position
    const index = mesh.geometry.index
    if (!index) {
      for (let i = 0; i < pos.count; i++) box.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld))
      return
    }
    const seen = new Uint8Array(pos.count)
    for (let i = 0; i < index.count; i++) {
      const k = index.getX(i)
      if (seen[k]) continue
      seen[k] = 1
      box.expandByPoint(v.fromBufferAttribute(pos, k).applyMatrix4(mesh.matrixWorld))
    }
  })
  return box
}

/**
 * Loads the realistic M4 Competition, normalises it (orientation, real-world
 * size, wheels on the floor), recolours paint/wheels/calipers and fits the
 * track aero from the reference photos.
 */
export default function RealM4({ paint }) {
  const { scene } = useGLTF(M4_MODEL.url)
  const target = useRef(new THREE.Color(paint.hex))

  const { object, paintMaterials, aero, aeroMaterials } = useMemo(() => {
    const object = scene.clone(true)
    const isPaint = byName(M4_MODEL.materials.paint)
    const isRim = byName(M4_MODEL.materials.rims)
    const isCaliper = byName(M4_MODEL.materials.calipers)
    const cache = new Map()
    const paintMaterials = []

    const convert = (m) => {
      if (cache.has(m)) return cache.get(m)
      let out = m
      if (isPaint(m)) {
        out = new THREE.MeshPhysicalMaterial({
          name: m.name,
          color: paint.hex,
          metalness: 0.15,
          roughness: 0.28,
          clearcoat: 1,
          clearcoatRoughness: 0.03,
          envMapIntensity: 1.3,
        })
        paintMaterials.push(out)
      } else if (isRim(m)) {
        // Satin dark-bronze forged wheels, like the reference car.
        out = new THREE.MeshPhysicalMaterial({
          name: m.name,
          color: '#3a342c',
          metalness: 0.9,
          roughness: 0.32,
          clearcoat: 0.4,
          clearcoatRoughness: 0.3,
        })
      } else if (isCaliper(m)) {
        out = new THREE.MeshPhysicalMaterial({
          name: m.name,
          color: '#1f55d8',
          metalness: 0.1,
          roughness: 0.35,
          clearcoat: 1,
        })
      } else {
        out = m.clone()
        if ('envMapIntensity' in out) out.envMapIntensity = 1.1
      }
      cache.set(m, out)
      return out
    }

    object.traverse((child) => {
      if (!child.isMesh) return
      child.material = Array.isArray(child.material) ? child.material.map(convert) : convert(child.material)
    })

    // Orientation, scale and ground contact.
    const holder = new THREE.Group()
    holder.add(object)
    object.rotation.y = M4_MODEL.rotationY
    let box = drawnBox(holder)
    const size = box.getSize(new THREE.Vector3())
    object.scale.multiplyScalar(M4_MODEL.length / Math.max(size.x, size.z))
    box = drawnBox(holder)
    const center = box.getCenter(new THREE.Vector3())
    object.position.set(-center.x, -box.min.y, -center.z)
    box = drawnBox(holder)

    // Aero kit, ray-cast onto the body.
    const raycaster = new THREE.Raycaster()
    const meshes = []
    object.traverse((c) => c.isMesh && meshes.push(c))
    const hit = (origin, dir) => {
      raycaster.set(origin, dir)
      return raycaster.intersectObjects(meshes, false)[0]?.point ?? null
    }
    const aero = buildAero(box, hit)
    const aeroMaterials = {
      carbon: new THREE.MeshPhysicalMaterial({
        map: carbonTexture(),
        metalness: 0.3,
        roughness: 0.38,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        side: THREE.DoubleSide,
      }),
      black: new THREE.MeshPhysicalMaterial({
        color: '#0b0c0e',
        metalness: 0.4,
        roughness: 0.35,
        clearcoat: 0.6,
        side: THREE.DoubleSide,
      }),
    }
    holder.remove(object)
    return { object, paintMaterials, aero, aeroMaterials }
    // `paint` only seeds the first colour; later changes are animated below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])

  useEffect(() => {
    target.current.set(paint.hex)
    paintMaterials.forEach((m) => {
      m.metalness = paint.metallic ? 0.55 : 0.12
      m.roughness = paint.metallic ? 0.25 : 0.3
    })
  }, [paint, paintMaterials])

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 6)
    paintMaterials.forEach((m) => m.color.lerp(target.current, k))
  })

  return (
    <group>
      <primitive object={object} />
      <mesh geometry={aero.carbon} material={aeroMaterials.carbon} />
      <mesh geometry={aero.black} material={aeroMaterials.black} />
    </group>
  )
}

useGLTF.preload(M4_MODEL.url)
