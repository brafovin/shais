/*
 * Track aero inspired by the reference car (Verus Engineering M4):
 * swan-neck GT wing, front splitter and dive planes ("canards").
 * Everything is placed by ray-casting against the loaded car so it sits on
 * the real body surfaces.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const clean = (g) => {
  const out = g.index ? g.toNonIndexed() : g
  Object.keys(out.attributes).forEach((k) => !['position', 'normal', 'uv'].includes(k) && out.deleteAttribute(k))
  out.clearGroups()
  return out
}

/** Inverted, cambered aerofoil (NACA-style) — chord along +X, thickness along Y. */
function aerofoilShape(chord, thickness, camber) {
  const n = 28
  const upper = []
  const lower = []
  for (let i = 0; i <= n; i++) {
    const s = 0.5 - 0.5 * Math.cos((i / n) * Math.PI)
    const yt = 5 * thickness * (0.2969 * Math.sqrt(s) - 0.126 * s - 0.3516 * s * s + 0.2843 * s ** 3 - 0.1036 * s ** 4)
    // Camber pointing down: the wing pushes the car onto the road.
    const yc = -camber * (s < 0.4 ? (2 * 0.4 * s - s * s) / 0.16 : (1 - 0.8 + 2 * 0.4 * s - s * s) / 0.36)
    upper.push([s * chord, (yc + yt) * chord])
    lower.push([s * chord, (yc - yt) * chord])
  }
  const shape = new THREE.Shape()
  shape.moveTo(...upper[0])
  upper.slice(1).forEach((p) => shape.lineTo(...p))
  lower.reverse().forEach((p) => shape.lineTo(...p))
  shape.closePath()
  return shape
}

function roundedRect(w, h, r) {
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
  return s
}

/** Flat band following a 2D curve (x, y), extruded `thickness` along Z. */
function bandAlong(curve, width, thickness, z) {
  const pts = curve.getSpacedPoints(40)
  const left = []
  const right = []
  pts.forEach((p, i) => {
    const t = curve.getTangentAt(i / (pts.length - 1))
    const nx = -t.y
    const ny = t.x
    // Taper the band towards the wing end.
    const w = (width * (1 - 0.35 * (i / (pts.length - 1)))) / 2
    left.push(new THREE.Vector2(p.x + nx * w, p.y + ny * w))
    right.push(new THREE.Vector2(p.x - nx * w, p.y - ny * w))
  })
  const shape = new THREE.Shape([...left, ...right.reverse()])
  const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 1 })
  g.translate(0, 0, z - thickness / 2)
  return g
}

/**
 * Builds the aero kit for a car whose nose points to +X and whose wheels sit
 * on y = 0. `hit(origin, dir)` returns the first surface point or null.
 */
export function buildAero(box, hit) {
  const carbon = []
  const black = []
  const len = box.max.x - box.min.x
  const halfW = (box.max.z - box.min.z) / 2
  const down = new THREE.Vector3(0, -1, 0)

  /* ---------- swan-neck GT wing ---------- */
  const deckAt = (x, z) => hit(new THREE.Vector3(x, box.max.y + 1, z), down)?.y ?? box.max.y * 0.72
  const rearX = box.min.x
  const roofY = box.max.y
  const chord = 0.3
  const span = Math.min(1.62, halfW * 2 - 0.2)
  const wingLE = rearX + 0.24 // leading edge, slightly ahead of the boot lip
  const wingY = roofY + 0.015
  const aoa = -0.16

  const wing = new THREE.ExtrudeGeometry(aerofoilShape(chord, 0.12, 0.05), {
    depth: span,
    bevelEnabled: false,
    curveSegments: 1,
  })
  wing.translate(0, 0, -span / 2)
  wing.rotateY(Math.PI) // leading edge to +X → chord runs towards the tail
  wing.rotateZ(aoa)
  wing.translate(wingLE, wingY, 0)
  carbon.push(wing)

  // Gurney flap along the trailing edge.
  const te = new THREE.Vector3(-chord, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), aoa)
  const gurney = new THREE.BoxGeometry(0.004, 0.022, span)
  gurney.translate(wingLE + te.x, wingY + te.y + 0.011, 0)
  black.push(gurney)

  // End plates.
  for (const s of [-1, 1]) {
    const plate = new THREE.ExtrudeGeometry(roundedRect(0.4, 0.22, 0.05), {
      depth: 0.008,
      bevelEnabled: false,
      curveSegments: 6,
    })
    plate.translate(wingLE - chord / 2 - 0.02, wingY - 0.02, s * (span / 2) - 0.004 + s * 0.004)
    carbon.push(plate)
  }

  // Swan-neck uprights: rise from the boot lid and hook over onto the wing.
  for (const s of [-1, 1]) {
    const z = s * Math.min(0.42, halfW * 0.48)
    const baseX = rearX + 0.42
    const baseY = deckAt(baseX, z) - 0.01
    const attachX = wingLE - chord * 0.45
    const attach = new THREE.Vector3(attachX, wingY + Math.sin(-aoa) * chord * 0.45 + 0.012, 0)
    const curve = new THREE.CubicBezierCurve(
      new THREE.Vector2(baseX, baseY),
      new THREE.Vector2(baseX + 0.06, baseY + (attach.y - baseY) * 0.9),
      new THREE.Vector2(attach.x + 0.12, attach.y + 0.13),
      new THREE.Vector2(attach.x, attach.y),
    )
    black.push(bandAlong(curve, 0.075, 0.014, z))
    const foot = new THREE.BoxGeometry(0.14, 0.012, 0.05)
    foot.translate(baseX, baseY + 0.004, z)
    black.push(foot)
  }

  /* ---------- front splitter ---------- */
  const back = new THREE.Vector3(-1, 0, 0)
  const frontAt = (y, z) => hit(new THREE.Vector3(box.max.x + 1, y, z), back)?.x
  const lowY = box.min.y + 0.11
  let underY = hit(new THREE.Vector3(box.max.x - 0.12, -1, 0), new THREE.Vector3(0, 1, 0))?.y ?? lowY
  underY = Math.min(Math.max(underY, 0.09), 0.22)
  const zs = Array.from({ length: 33 }, (_, i) => -0.86 + (1.72 * i) / 32).map((z) => z * (halfW / 0.95))
  const edge = zs.map((z) => [frontAt(underY + 0.04, z) ?? frontAt(underY + 0.12, z) ?? box.max.x - 0.2, z])
  const splitterShape = new THREE.Shape()
  edge.forEach(([x, z], i) => (i ? splitterShape.lineTo(x + 0.07, -z) : splitterShape.moveTo(x + 0.07, -z)))
  ;[...edge].reverse().forEach(([x, z]) => splitterShape.lineTo(x - 0.3, -z))
  splitterShape.closePath()
  const splitter = new THREE.ExtrudeGeometry(splitterShape, { depth: 0.016, bevelEnabled: false, curveSegments: 1 })
  splitter.rotateX(-Math.PI / 2)
  splitter.translate(0, underY - 0.018, 0)
  carbon.push(splitter)

  /* ---------- canards (two per side on the bumper corners) ---------- */
  for (const s of [-1, 1]) {
    ;[
      [0.4, 0.2],
      [0.3, 0.17],
    ].forEach(([y, size], k) => {
      const dir = new THREE.Vector3(-0.72, 0, -0.7 * s).normalize()
      const origin = new THREE.Vector3(box.max.x - 0.45 + 2, y, s * (halfW - 0.08) + s * 2)
      const p = hit(origin, dir)
      if (!p) return
      const blade = new THREE.ExtrudeGeometry(
        new THREE.Shape([
          new THREE.Vector2(0, 0),
          new THREE.Vector2(size, 0),
          new THREE.Vector2(size * 0.8, 0.07 - k * 0.01),
          new THREE.Vector2(size * 0.08, 0.05),
        ]),
        { depth: 0.006, bevelEnabled: false },
      )
      // Lay the blade flat (shape Y → outward), tilt it nose-down, then yaw it
      // to follow the bumper corner.
      blade.translate(-size / 2, -0.01, -0.003)
      blade.rotateX(Math.PI / 2)
      if (s < 0) blade.scale(1, 1, -1)
      blade.rotateZ(0.2)
      blade.rotateY(s * 0.75)
      blade.translate(p.x, p.y, p.z)
      carbon.push(blade)
    })
  }

  return {
    carbon: mergeGeometries(carbon.map(clean)),
    black: mergeGeometries(black.map(clean)),
    length: len,
  }
}
