import * as THREE from 'three'

/** Carbon-fibre twill weave drawn on a canvas (no image assets needed). */
function carbonTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#0b0c0e'
  ctx.fillRect(0, 0, size, size)
  const cell = size / 4
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const horizontal = (i + j) % 2 === 0
      const g = horizontal
        ? ctx.createLinearGradient(0, j * cell, 0, (j + 1) * cell)
        : ctx.createLinearGradient(i * cell, 0, (i + 1) * cell, 0)
      g.addColorStop(0, '#111215')
      g.addColorStop(0.5, '#2a2c31')
      g.addColorStop(1, '#111215')
      ctx.fillStyle = g
      ctx.fillRect(i * cell + 1, j * cell + 1, cell - 2, cell - 2)
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** Horizontal slats for the kidney grille. */
function slatTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 8
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#050506'
  ctx.fillRect(0, 0, 8, 64)
  const g = ctx.createLinearGradient(0, 18, 0, 46)
  g.addColorStop(0, '#16171a')
  g.addColorStop(0.45, '#4a4e55')
  g.addColorStop(1, '#16171a')
  ctx.fillStyle = g
  ctx.fillRect(0, 18, 8, 28)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.repeat.set(1, 1 / 0.018) // one slat every 18 mm (UVs are in metres)
  return tex
}

export function createMaterials() {
  const carbonMap = carbonTexture()
  const roofCarbon = carbonMap.clone()
  roofCarbon.repeat.set(70, 90)
  roofCarbon.needsUpdate = true
  const partsCarbon = carbonMap.clone()
  partsCarbon.repeat.set(30, 30)
  partsCarbon.needsUpdate = true

  return {
    paint: new THREE.MeshPhysicalMaterial({
      color: '#f2c200',
      metalness: 0.2,
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.25,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#06080b',
      metalness: 0.1,
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0,
      envMapIntensity: 1.1,
    }),
    roof: new THREE.MeshPhysicalMaterial({
      map: roofCarbon,
      metalness: 0.25,
      roughness: 0.55,
      clearcoat: 0.35,
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.3,
    }),
    carbon: new THREE.MeshPhysicalMaterial({
      map: partsCarbon,
      metalness: 0.35,
      roughness: 0.4,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      side: THREE.DoubleSide,
    }),
    gloss: new THREE.MeshPhysicalMaterial({
      color: '#08090a',
      metalness: 0.5,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    }),
    matte: new THREE.MeshStandardMaterial({ color: '#0a0a0b', roughness: 0.75, metalness: 0.2 }),
    wells: new THREE.MeshStandardMaterial({
      color: '#050505',
      roughness: 0.95,
      side: THREE.DoubleSide,
      // The arch caps touch the body surface; keep them from z-fighting with it.
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 2,
    }),
    chrome: new THREE.MeshStandardMaterial({ color: '#30333a', metalness: 1, roughness: 0.18 }),
    mirror: new THREE.MeshStandardMaterial({ color: '#a8b3bd', metalness: 1, roughness: 0.03 }),
    headGlass: new THREE.MeshPhysicalMaterial({
      color: '#0d1218',
      metalness: 0.9,
      roughness: 0.08,
      clearcoat: 1,
      envMapIntensity: 2,
    }),
    drl: new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: '#e8f4ff',
      emissiveIntensity: 3.2,
      toneMapped: false,
    }),
    laser: new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: '#2f7bff',
      emissiveIntensity: 4,
      toneMapped: false,
    }),
    tailGlass: new THREE.MeshPhysicalMaterial({
      color: '#260202',
      emissive: '#3a0000',
      emissiveIntensity: 0.8,
      metalness: 0.3,
      roughness: 0.08,
      clearcoat: 1,
    }),
    tailLight: new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: '#ff1a1a',
      emissiveIntensity: 3,
      toneMapped: false,
    }),
    kidneySlats: new THREE.MeshStandardMaterial({ map: slatTexture(), metalness: 0.6, roughness: 0.35 }),
    kidneyFrame: new THREE.MeshPhysicalMaterial({
      color: '#15161a',
      metalness: 0.9,
      roughness: 0.16,
      clearcoat: 1,
    }),
    tire: new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.9, metalness: 0 }),
    rim: new THREE.MeshPhysicalMaterial({
      color: '#2a2c31',
      metalness: 0.85,
      roughness: 0.3,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
    }),
    rimInner: new THREE.MeshStandardMaterial({
      color: '#1a1b1e',
      metalness: 0.7,
      roughness: 0.5,
      side: THREE.DoubleSide,
    }),
    disc: new THREE.MeshStandardMaterial({ color: '#8d9095', metalness: 0.9, roughness: 0.42 }),
    caliper: new THREE.MeshPhysicalMaterial({
      color: '#1f5ad6',
      metalness: 0.1,
      roughness: 0.35,
      clearcoat: 1,
    }),
    exhaust: new THREE.MeshStandardMaterial({
      color: '#3b3d42',
      metalness: 1,
      roughness: 0.22,
      side: THREE.DoubleSide,
    }),
  }
}
