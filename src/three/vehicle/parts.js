/*
 * Detail builders shared by all procedural vehicles: glass, trims, kidney
 * grilles, lamps, mirrors, roof rails and wheels. Every builder pushes
 * geometry into `add(materialKey, geometry)`.
 */
import * as THREE from 'three'
import { mergeGeometries, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { clean, lerp, monotone, polygonParam, stripParam } from './kit.js'

const both = (fn) => [1, -1].forEach(fn)

/* ------------------------------------------------------------------ */
/* Greenhouse: glass, pillars, window surrounds, roof                   */
/* ------------------------------------------------------------------ */

export function greenhouse(body, add) {
  const G = body.spec.glass
  const C = body.spec.cabin
  const side = (t, s) => (s > 0 ? t : 2 - t)

  // Windscreen and rear window.
  add('glass', body.cabinPatch((u, v) => [lerp(G.windscreen[0], C.x1, u), lerp(G.screenT, 2 - G.screenT, v)], 40, 50, 0.004))
  add('glass', body.cabinPatch((u, v) => [lerp(C.x0, G.rear[1], u), lerp(G.rearT, 2 - G.rearT, v)], 30, 50, 0.004))

  // Side windows (one band per side; pillars are drawn over it).
  const rearEdge = monotone(G.sideRear)
  both((s) =>
    add(
      'glass',
      body.cabinPatch(
        (u, v) => {
          const t = lerp(0.03, G.sideTop, v)
          return [lerp(rearEdge(v), G.sideFront, u), side(t, s)]
        },
        80,
        18,
        0.004,
      ),
    ),
  )

  // Black pillars (B, C …) and the window surround along the top of the glass.
  both((s) => {
    G.pillars.forEach(([x0, x1]) =>
      add(
        'black',
        body.cabinPatch(
          (u, v) => [lerp(x0, x1, u), side(lerp(0.0, G.sideTop + 0.02, v), s)],
          4,
          14,
          0.008,
        ),
      ),
    )
    add(
      G.surround ?? 'black',
      body.cabinPatch(
        (u, v) => [lerp(rearEdge(1) - 0.02, G.surroundFront ?? G.windscreen[0] + 0.05, u), side(lerp(G.sideTop, G.sideTop + 0.03, v), s)],
        50,
        2,
        0.006,
      ),
    )
    add(
      G.surround ?? 'black',
      body.cabinPatch(
        (u, v) => [lerp(rearEdge(0) - 0.03, G.sideFront - 0.05, u), side(lerp(0.005, 0.03, v), s)],
        60,
        2,
        0.006,
      ),
    )
  })

  // Roof panel: glass sunroof, black or body colour.
  if (G.roof) {
    add(
      G.roof.material,
      body.cabinPatch((u, v) => [lerp(G.roof.x0, G.roof.x1, u), lerp(G.roof.t, 2 - G.roof.t, v)], 40, 40, 0.005),
    )
  }
}

/** Roof rails following the greenhouse. */
export function roofRails(body, add, { x0, x1, t = 0.43, lift = 0.035 }) {
  both((s) => {
    const pts = []
    for (let i = 0; i <= 24; i++) {
      const x = lerp(x0, x1, i / 24)
      const p = body.cabinPoint(x, s > 0 ? t : 2 - t)
      const lift_ = lift * Math.sin((Math.PI * i) / 24) ** 0.25
      pts.push(new THREE.Vector3(p.x, p.y + lift_, p.z))
    }
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.013, 8, false)
    add('black', tube)
  })
}

/** Exterior mirrors near the A-pillar base. */
export function mirrors(body, add, { x, material = 'paint', size = 1 }) {
  const c = body.cabinSection(x)
  both((s) => {
    const z = s * (c.wb + 0.13 * size)
    const y = c.y0 + 0.11 * size
    const housing = new THREE.SphereGeometry(1, 24, 16)
    housing.scale(0.075 * size, 0.07 * size, 0.13 * size)
    housing.translate(x, y, z)
    add(material, housing)
    const glass = new THREE.CircleGeometry(1, 24)
    glass.scale(0.06 * size, 0.055 * size, 1)
    glass.rotateY(-Math.PI / 2)
    glass.translate(x - 0.068 * size, y, z)
    add('mirror', glass)
    const arm = new THREE.BoxGeometry(0.06, 0.03, 0.14 * size)
    arm.translate(x + 0.01, y - 0.04 * size, s * (c.wb + 0.04))
    add('black', arm)
  })
}

/** Door shut lines, handles and the black sill trim along both sides. */
export function sides(body, add, { lines = [], handles = [], sill, handleMaterial = 'chrome' }) {
  both((s) => {
    lines.forEach((pts) => add('gap', body.sidePatch(stripParam(pts, 0.005), 30, 1, 0.0015, s)))
    handles.forEach(([x, y]) =>
      add(
        handleMaterial,
        body.sidePatch((u, v) => [x - 0.07 + 0.14 * u, y - 0.012 + 0.024 * v], 6, 2, 0.006, s),
      ),
    )
    if (sill) {
      const [x0, x1, y0, y1] = sill
      add('black', body.sidePatch((u, v) => [lerp(x0, x1, u), lerp(y0, y1, v)], 40, 6, 0.006, s))
    }
  })
}

/* ------------------------------------------------------------------ */
/* Lamps and front/rear decals                                          */
/* ------------------------------------------------------------------ */

/** Polygon [[z, y], …] projected on the nose (mirrored to both sides unless `centre`). */
export function frontPoly(body, add, key, poly, { offset = 0.005, centre = false, nu = 30, nv = 6 } = {}) {
  const sides_ = centre ? [1] : [1, -1]
  sides_.forEach((s) => {
    const mapped = poly.map(([z, y]) => [z * s, y])
    add(key, body.frontPatch(polygonParam(mapped), nu, nv, offset))
  })
}

/** Light strip along a polyline [[z, y], …] on the nose. */
export function frontStrip(body, add, key, pts, width, { offset = 0.009, centre = false } = {}) {
  const sides_ = centre ? [1] : [1, -1]
  sides_.forEach((s) => add(key, body.frontPatch(stripParam(pts.map(([z, y]) => [z * s, y]), width), 40, 2, offset)))
}

export function rearPoly(body, add, key, poly, { offset = 0.005, centre = false, nu = 30, nv = 6 } = {}) {
  const sides_ = centre ? [1] : [1, -1]
  sides_.forEach((s) => add(key, body.rearPatch(polygonParam(poly.map(([z, y]) => [z * s, y])), nu, nv, offset)))
}

export function rearStrip(body, add, key, pts, width, { offset = 0.009, centre = false } = {}) {
  const sides_ = centre ? [1] : [1, -1]
  sides_.forEach((s) => add(key, body.rearPatch(stripParam(pts.map(([z, y]) => [z * s, y]), width), 40, 2, offset)))
}

/** Polygon [[x, y], …] on the body sides. */
export function sidePoly(body, add, key, poly, { offset = 0.005 } = {}) {
  both((s) => add(key, body.sidePatch(polygonParam(poly), 30, 6, offset, s)))
}

/* ------------------------------------------------------------------ */
/* Kidney grille                                                        */
/* ------------------------------------------------------------------ */

/** Closed outline from points with optional per-corner rounding. */
function roundedPolygon(points, radius) {
  const shape = new THREE.Shape()
  const n = points.length
  for (let i = 0; i < n; i++) {
    const p = new THREE.Vector2(...points[i])
    const prev = new THREE.Vector2(...points[(i - 1 + n) % n])
    const next = new THREE.Vector2(...points[(i + 1) % n])
    const r = Array.isArray(radius) ? radius[i] : radius
    const a = p.clone().add(prev.clone().sub(p).normalize().multiplyScalar(Math.min(r, p.distanceTo(prev) / 2)))
    const b = p.clone().add(next.clone().sub(p).normalize().multiplyScalar(Math.min(r, p.distanceTo(next) / 2)))
    if (i === 0) shape.moveTo(a.x, a.y)
    else shape.lineTo(a.x, a.y)
    shape.quadraticCurveTo(p.x, p.y, b.x, b.y)
  }
  shape.closePath()
  return shape
}

function insetShape(points, radius, inset) {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length
  const w = Math.max(...points.map((p) => p[0])) - Math.min(...points.map((p) => p[0]))
  const h = Math.max(...points.map((p) => p[1])) - Math.min(...points.map((p) => p[1]))
  const kx = (w - 2 * inset) / w
  const ky = (h - 2 * inset) / h
  const pts = points.map(([x, y]) => [cx + (x - cx) * kx, cy + (y - cy) * ky])
  const r = Array.isArray(radius) ? radius.map((q) => Math.max(0.004, q - inset)) : Math.max(0.004, radius - inset)
  return { pts, r }
}

/**
 * Wraps a locally built geometry (a = outward from the centre line, b = up,
 * c = depth, c = 0 at the front face) onto the nose of the car.
 */
function conformToNose(body, geometry, { zc, yc, protrude, mirror }) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry
  const p = g.attributes.position
  const s = mirror ? -1 : 1
  for (let i = 0; i < p.count; i++) {
    const a = p.getX(i)
    const b = p.getY(i)
    const c = p.getZ(i)
    const z = s * (zc + a)
    const y = yc + b
    p.setXYZ(i, body.noseX(y, z) + protrude + c, y, z)
  }
  if (mirror) {
    for (let i = 0; i < p.count; i += 3) {
      for (const attr of Object.values(g.attributes)) {
        const k = attr.itemSize
        for (let j = 0; j < k; j++) {
          const t = attr.array[(i + 1) * k + j]
          attr.array[(i + 1) * k + j] = attr.array[(i + 2) * k + j]
          attr.array[(i + 2) * k + j] = t
        }
      }
    }
  }
  return toCreasedNormals(g, 0.6)
}

/**
 * Kidney grille. `outline` is one kidney (the +Z one) as points [a, b] in
 * metres, a measured from the car's centre line. Builds a frame, an inner
 * panel (textured: slats, mesh …) set back behind it, and mirrors both.
 */
export function kidneys(body, add, { outline, radius = 0.04, yc, frame = 0.018, depth = 0.06, protrude = 0.035, recess = 0.008, frameKey = 'chrome', innerKey = 'grille', single = false }) {
  const { pts: innerPts, r: innerR } = insetShape(outline, radius, frame)
  const inner = roundedPolygon(innerPts, innerR)
  const frameShape = roundedPolygon(outline, radius)
  frameShape.holes.push(inner)
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.005,
    bevelSegments: 3,
    curveSegments: 10,
  })
  frameGeo.translate(0, 0, -depth - 0.006)
  // The inner panel is a dense grid projected on the nose so it follows its
  // curvature (a flat cap would sink behind the bodywork). UVs are in metres
  // so slat / mesh textures keep their real size.
  const innerOutline = inner.getPoints(8).map((p) => [p.x, p.y])
  const sides_ = single ? [1] : [1, -1]
  sides_.forEach((s) => {
    add(frameKey, clean(conformToNose(body, frameGeo.clone(), { zc: 0, yc, protrude, mirror: s < 0 })))
    const poly = innerOutline.map(([a, b]) => [s * a, yc + b])
    const panel = body.frontPatch(polygonParam(poly), 40, 24, protrude - recess)
    const pos = panel.attributes.position
    const uv = panel.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getZ(i), pos.getY(i))
    add(innerKey, panel)
  })
}
/* ------------------------------------------------------------------ */
/* Exhausts                                                             */
/* ------------------------------------------------------------------ */

export function exhausts(body, add, { tips, y, r = 0.045, shape = 'round' }) {
  tips.forEach((z) => {
    const x = body.tailX(y, z)
    const g =
      shape === 'round'
        ? new THREE.CylinderGeometry(r, r, 0.12, 28, 1, true)
        : new THREE.CylinderGeometry(r, r, 0.12, 4, 1, true)
    g.rotateZ(Math.PI / 2)
    if (shape !== 'round') g.rotateX(Math.PI / 4)
    g.translate(x + 0.03, y, z)
    add('chromeDS', g)
    const plug = new THREE.CircleGeometry(r * 0.95, 20)
    plug.rotateY(-Math.PI / 2)
    plug.translate(x + 0.05, y, z)
    add('black', plug)
  })
}

/* ------------------------------------------------------------------ */
/* Wheels                                                               */
/* ------------------------------------------------------------------ */

const wheelCache = new Map()

/**
 * Wheel geometries for a style. Local +Z is the outer face.
 * styles: 'y' (5 Y-spokes), 'double' (5 double spokes), 'multi' (10 spokes),
 *         'aero' (turbine blades on a flat disc), 'star' (7 twisted spokes)
 */
export function wheelGeometry({ R, width, rimR, style }) {
  const key = [R, width, rimR, style].join('|')
  if (wheelCache.has(key)) return wheelCache.get(key)
  const h = width / 2
  const prof = [
    [rimR + 0.004, -h + 0.012],
    [R - 0.055, -h],
    [R - 0.02, -h + 0.008],
    [R - 0.002, -h + 0.035],
    [R, -h + 0.06],
    [R, h - 0.06],
    [R - 0.002, h - 0.035],
    [R - 0.02, h - 0.008],
    [R - 0.055, h],
    [rimR + 0.004, h - 0.012],
  ].map(([r, y]) => new THREE.Vector2(r, y))
  const tire = new THREE.LatheGeometry(prof, 72)
  tire.rotateX(Math.PI / 2)

  const barrel = new THREE.CylinderGeometry(rimR, rimR, width - 0.04, 48, 1, true)
  barrel.rotateX(Math.PI / 2)
  const backPlate = new THREE.CircleGeometry(rimR, 48)
  backPlate.translate(0, 0, -0.08)

  const rim = []
  const face = []
  const lip = new THREE.TorusGeometry(rimR - 0.004, 0.011, 10, 72)
  lip.translate(0, 0, h - 0.025)
  rim.push(lip)
  const hub = new THREE.CylinderGeometry(0.07, 0.078, 0.05, 40)
  hub.rotateX(Math.PI / 2)
  hub.translate(0, 0, h - 0.06)
  rim.push(hub)
  const cap = new THREE.CylinderGeometry(0.032, 0.032, 0.012, 32)
  cap.rotateX(Math.PI / 2)
  cap.translate(0, 0, h - 0.03)

  const spoke = (phi0, phi1, r0, r1, wid, z0, z1, bucket, thick = 0.03) => {
    const a = new THREE.Vector3(Math.cos(phi0) * r0, Math.sin(phi0) * r0, z0)
    const b = new THREE.Vector3(Math.cos(phi1) * r1, Math.sin(phi1) * r1, z1)
    const g = new THREE.BoxGeometry(a.distanceTo(b), wid, thick)
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), b.clone().sub(a).normalize()))
    const m = a.clone().add(b).multiplyScalar(0.5)
    g.translate(m.x, m.y, m.z)
    bucket.push(g)
  }
  const rr = rimR - 0.012
  const zIn = h - 0.06
  const zOut = h - 0.03
  if (style === 'y') {
    for (let k = 0; k < 5; k++) {
      const phi = (k / 5) * Math.PI * 2
      spoke(phi, phi, 0.06, rr * 0.55, 0.04, zIn, zIn + 0.01, rim)
      for (const d of [-0.22, 0.22]) {
        spoke(phi, phi + d, rr * 0.5, rr, 0.026, zIn + 0.01, zOut, rim)
        spoke(phi, phi + d, rr * 0.5, rr, 0.012, zIn + 0.03, zOut + 0.016, face, 0.004)
      }
    }
  } else if (style === 'double') {
    for (let k = 0; k < 5; k++) {
      const phi = (k / 5) * Math.PI * 2
      for (const d of [-0.1, 0.1]) spoke(phi + d * 0.4, phi + d, 0.06, rr, 0.03, zIn, zOut, rim)
    }
  } else if (style === 'multi') {
    for (let k = 0; k < 10; k++) {
      const phi = (k / 10) * Math.PI * 2
      spoke(phi, phi + 0.06, 0.06, rr, 0.026, zIn, zOut, rim)
      spoke(phi, phi + 0.06, 0.07, rr, 0.01, zIn + 0.02, zOut + 0.016, face, 0.004)
    }
  } else if (style === 'star') {
    for (let k = 0; k < 7; k++) {
      const phi = (k / 7) * Math.PI * 2
      spoke(phi, phi + 0.25, 0.06, rr, 0.034, zIn, zOut, rim)
      spoke(phi, phi + 0.25, 0.07, rr, 0.014, zIn + 0.02, zOut + 0.016, face, 0.004)
    }
  } else {
    // aero: flat disc ring with many twisted blades
    const disc = new THREE.RingGeometry(rr * 0.62, rr, 64)
    disc.translate(0, 0, zOut - 0.004)
    face.push(disc)
    for (let k = 0; k < 20; k++) {
      const phi = (k / 20) * Math.PI * 2
      spoke(phi, phi + 0.35, 0.07, rr * 0.64, 0.022, zIn, zOut, rim)
    }
  }
  const out = {
    tire: clean(tire),
    rim: mergeGeometries(rim.map(clean)),
    face: face.length ? mergeGeometries(face.map(clean)) : null,
    inner: mergeGeometries([clean(barrel), clean(backPlate)]),
    cap: clean(cap),
    disc: (() => {
      const d = new THREE.CylinderGeometry(rimR * 0.82, rimR * 0.82, 0.03, 56)
      d.rotateX(Math.PI / 2)
      d.translate(0, 0, -0.01)
      return clean(d)
    })(),
    caliper: (() => {
      const c = new THREE.TorusGeometry(rimR * 0.7, 0.04, 10, 18, 0.95)
      c.translate(0, 0, 0.035)
      c.rotateZ(-0.475)
      return clean(c)
    })(),
  }
  wheelCache.set(key, out)
  return out
}

/* ------------------------------------------------------------------ */
/* Badge                                                                */
/* ------------------------------------------------------------------ */

/**
 * Small round badge (blue/white quadrants in a black ring) placed on a surface
 * point with a given outward normal.
 */
export function roundel(add, position, normal, radius = 0.04) {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize())
  const place = (g, lift) => {
    g.applyQuaternion(q)
    g.translate(position.x + normal.x * lift, position.y + normal.y * lift, position.z + normal.z * lift)
    return g
  }
  add('black', place(new THREE.CircleGeometry(radius, 32), 0.004))
  for (let k = 0; k < 4; k++) {
    const g = new THREE.CircleGeometry(radius * 0.66, 12, (k * Math.PI) / 2, Math.PI / 2)
    add(k % 2 ? 'badgeWhite' : 'badgeBlue', place(g, 0.006))
  }
  const ring = new THREE.RingGeometry(radius * 0.66, radius * 0.7, 32)
  add('chrome', place(ring, 0.0065))
}
