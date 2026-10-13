import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { DIM } from './carShape.js'

const TIRE_W = 0.275
const RIM_R = 0.238

const clean = (g) => {
  const out = g.index ? g.toNonIndexed() : g
  Object.keys(out.attributes).forEach((k) => !['position', 'normal'].includes(k) && out.deleteAttribute(k))
  out.clearGroups()
  return out
}

/** Geometry shared by all four wheels. Local +Z is the outer face of the wheel. */
function buildWheel() {
  const R = DIM.wheelR
  const h = TIRE_W / 2

  // Tyre: lathe of a rounded sidewall profile, axis rotated from Y to Z.
  const profile = [
    [RIM_R + 0.004, -h + 0.012],
    [R - 0.05, -h],
    [R - 0.018, -h + 0.008],
    [R - 0.002, -h + 0.035],
    [R, -h + 0.06],
    [R, h - 0.06],
    [R - 0.002, h - 0.035],
    [R - 0.018, h - 0.008],
    [R - 0.05, h],
    [RIM_R + 0.004, h - 0.012],
  ].map(([r, y]) => new THREE.Vector2(r, y))
  const tire = new THREE.LatheGeometry(profile, 72)
  tire.rotateX(Math.PI / 2)

  // Rim barrel (seen through the spokes).
  const barrel = new THREE.CylinderGeometry(RIM_R, RIM_R, TIRE_W - 0.04, 48, 1, true)
  barrel.rotateX(Math.PI / 2)
  const backPlate = new THREE.CircleGeometry(RIM_R, 48)
  backPlate.translate(0, 0, -0.07)

  // Rim face: lip, hub and 5 Y-spokes (10 arms).
  const face = []
  const lip = new THREE.TorusGeometry(RIM_R - 0.004, 0.011, 10, 72)
  lip.translate(0, 0, h - 0.025)
  face.push(lip)
  const hub = new THREE.CylinderGeometry(0.068, 0.075, 0.05, 40)
  hub.rotateX(Math.PI / 2)
  hub.translate(0, 0, h - 0.06)
  face.push(hub)
  for (let k = 0; k < 5; k++) {
    const phi = (k / 5) * Math.PI * 2
    for (const spread of [-0.2, 0.2]) {
      const a = new THREE.Vector3(Math.cos(phi) * 0.06, Math.sin(phi) * 0.06, h - 0.05)
      const b = new THREE.Vector3(Math.cos(phi + spread) * (RIM_R - 0.01), Math.sin(phi + spread) * (RIM_R - 0.01), h - 0.03)
      const len = a.distanceTo(b)
      const spoke = new THREE.BoxGeometry(len, 0.03, 0.028)
      const mid = a.clone().add(b).multiplyScalar(0.5)
      const dir = b.clone().sub(a).normalize()
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir)
      spoke.applyQuaternion(q)
      spoke.translate(mid.x, mid.y, mid.z)
      face.push(spoke)
    }
  }
  // Wheel bolts.
  const bolts = []
  for (let k = 0; k < 5; k++) {
    const phi = (k / 5) * Math.PI * 2 + Math.PI / 5
    const bolt = new THREE.CylinderGeometry(0.009, 0.009, 0.02, 10)
    bolt.rotateX(Math.PI / 2)
    bolt.translate(Math.cos(phi) * 0.045, Math.sin(phi) * 0.045, h - 0.03)
    bolts.push(bolt)
  }
  const cap = new THREE.CylinderGeometry(0.028, 0.028, 0.012, 32)
  cap.rotateX(Math.PI / 2)
  cap.translate(0, 0, h - 0.03)

  // Brake disc and caliper (caliper is added per wheel so it sits at the rear).
  const disc = new THREE.CylinderGeometry(0.19, 0.19, 0.028, 56)
  disc.rotateX(Math.PI / 2)
  disc.translate(0, 0, -0.01)
  const caliper = new THREE.TorusGeometry(0.168, 0.036, 10, 18, 0.95)
  caliper.scale(1, 1, 0.9)
  caliper.translate(0, 0, 0.03)
  caliper.rotateZ(-0.475)

  return {
    tire: clean(tire),
    rim: mergeGeometries(face.map(clean)),
    rimInner: mergeGeometries([clean(barrel), clean(backPlate)]),
    bolts: mergeGeometries([...bolts.map(clean), clean(cap)]),
    disc: clean(disc),
    caliper: clean(caliper),
  }
}

let shared
const geometries = () => (shared ??= buildWheel())

/**
 * A single wheel. `side` = +1 for the right side of the car (+Z), −1 for the left.
 * `front` controls which way "rear" is for the brake caliper.
 */
export default function Wheel({ position, side, materials }) {
  const g = geometries()
  // The caliper sits on the rear-upper part of the disc (towards −X).
  const caliperAngle = side > 0 ? Math.PI * 0.72 : Math.PI * 0.28
  return (
    <group position={position} rotation-y={side > 0 ? 0 : Math.PI}>
      <mesh geometry={g.tire} material={materials.tire} />
      <mesh geometry={g.rim} material={materials.rim} />
      <mesh geometry={g.rimInner} material={materials.rimInner} />
      <mesh geometry={g.bolts} material={materials.chrome} />
      <mesh geometry={g.disc} material={materials.disc} />
      <mesh geometry={g.caliper} material={materials.caliper} rotation-z={caliperAngle} />
    </group>
  )
}
