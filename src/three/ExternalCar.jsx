import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { M4_MODEL } from '../config.js'

/**
 * Checks (with a HEAD request) whether the optional GLB exists, so the
 * procedural car is used without a failed download when it doesn't.
 */
export function useOptionalModel(url = M4_MODEL.url) {
  const [state, setState] = useState('checking')
  useEffect(() => {
    let alive = true
    fetch(url, { method: 'HEAD' })
      .then((r) => {
        const type = r.headers.get('content-type') || ''
        // Dev servers answer unknown paths with index.html, so HTML means "missing".
        if (alive) setState(r.ok && !type.includes('text/html') ? 'available' : 'missing')
      })
      .catch(() => alive && setState('missing'))
    return () => {
      alive = false
    }
  }, [url])
  return state
}

export class ModelErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    console.warn('[M4] Could not load external model, using the procedural car instead.', error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Loads, normalises (scale, orientation, ground contact) and recolours a GLB car. */
export default function ExternalCar({ paint }) {
  const { scene } = useGLTF(M4_MODEL.url)
  const target = useRef(new THREE.Color(paint.hex))

  const { object, paintMaterials } = useMemo(() => {
    const object = scene.clone(true)
    const paintMaterials = new Set()
    object.traverse((child) => {
      if (!child.isMesh) return
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      const cloned = mats.map((m) => {
        const c = m.clone()
        if (M4_MODEL.paintMaterial.test(c.name || '')) paintMaterials.add(c)
        return c
      })
      child.material = Array.isArray(child.material) ? cloned : cloned[0]
    })
    object.rotation.y = M4_MODEL.rotationY
    object.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(object)
    const size = box.getSize(new THREE.Vector3())
    const scale = M4_MODEL.length / Math.max(size.x, size.z)
    object.scale.setScalar(scale)
    object.updateMatrixWorld(true)
    box.setFromObject(object)
    const center = box.getCenter(new THREE.Vector3())
    object.position.set(-center.x, -box.min.y, -center.z)
    return { object, paintMaterials: [...paintMaterials] }
  }, [scene])

  useEffect(() => {
    target.current.set(paint.hex)
  }, [paint])

  useFrame((_, dt) => {
    paintMaterials.forEach((m) => m.color?.lerp(target.current, 1 - Math.exp(-dt * 6)))
  })

  return <primitive object={object} />
}
