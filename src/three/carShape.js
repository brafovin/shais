/*
 * Procedural BMW M4 Competition (G82) body.
 *
 * Everything is generated from a handful of 1D profiles (roof line, belt line,
 * width, ride height ...) so the car needs no external 3D assets. Units are
 * metres, the car points towards +X, Y is up and Z is the width axis.
 *
 *  - The lower body is a loft of super-ellipse cross-sections. Wheel arches are
 *    cut by clipping the section above the arch circle.
 *  - The greenhouse (cabin) is a second loft sitting on the belt line.
 *  - Windows, lights, intakes, etc. are "decals": small surface patches that
 *    are projected onto the body/cabin and lifted a few millimetres along the
 *    surface normal, so they follow the curvature exactly.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/* ------------------------------------------------------------------ */
/* Math helpers                                                         */
/* ------------------------------------------------------------------ */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Monotone cubic (Fritsch–Carlson) interpolation through [x, y] key points. */
export function monotone(points) {
  const n = points.length
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const d = []
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]))
  const m = new Array(n)
  m[0] = d[0]
  m[n - 1] = d[n - 2]
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = m[i] / d[i]
    const b = m[i + 1] / d[i]
    const s = a * a + b * b
    if (s > 9) {
      const t = 3 / Math.sqrt(s)
      m[i] = t * a * d[i]
      m[i + 1] = t * b * d[i]
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0]
    if (x >= xs[n - 1]) return ys[n - 1]
    let lo = 0
    let hi = n - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (xs[mid] > x) hi = mid
      else lo = mid
    }
    const h = xs[hi] - xs[lo]
    const t = (x - xs[lo]) / h
    const t2 = t * t
    const t3 = t2 * t
    return (
      (2 * t3 - 3 * t2 + 1) * ys[lo] +
      (t3 - 2 * t2 + t) * h * m[lo] +
      (-2 * t3 + 3 * t2) * ys[hi] +
      (t3 - t2) * h * m[hi]
    )
  }
}

function range(a, b, step) {
  const n = Math.max(1, Math.ceil(Math.abs(b - a) / step))
  return Array.from({ length: n + 1 }, (_, i) => lerp(a, b, i / n))
}

/* ------------------------------------------------------------------ */
/* Dimensions & profiles (≈ real G82 M4: 4.79 m long, 1.89 m wide)      */
/* ------------------------------------------------------------------ */

export const DIM = {
  front: 2.4,
  rear: -2.4,
  frontAxle: 1.46,
  rearAxle: -1.4,
  wheelR: 0.34,
  archR: 0.392,
  archCY: 0.355,
  track: 0.79, // wheel centre offset from the centre line
  rFront: 0.13, // end rounding radius (front)
  rRear: 0.13,
  bendFront: 0.24, // how much the bumper corners sweep back in plan view
  bendRear: 0.14,
  nTop: 6, // super-ellipse exponents of the body section
  nBot: 9,
}

/** Height of the body section top (hood / belt line / boot lid) along X. */
const topY = monotone([
  [-2.4, 0.9],
  [-2.3, 0.975],
  [-2.15, 1.012],
  [-1.85, 1.012],
  [-1.45, 0.99],
  [-0.9, 0.948],
  [-0.2, 0.928],
  [0.4, 0.918],
  [0.75, 0.9],
  [1.2, 0.86],
  [1.7, 0.818],
  [2.1, 0.78],
  [2.3, 0.75],
  [2.4, 0.72],
])

/** Height of the body underside (without wheel arches). */
const baseBottom = monotone([
  [-2.4, 0.25],
  [-2.15, 0.19],
  [-1.8, 0.165],
  [1.9, 0.15],
  [2.4, 0.14],
])

/** Half width of the body. Bulges over the wheels for the M flared arches. */
const halfWidth = monotone([
  [-2.4, 0.8],
  [-2.22, 0.885],
  [-1.95, 0.935],
  [-1.4, 0.958],
  [-0.9, 0.93],
  [-0.35, 0.908],
  [0.35, 0.905],
  [0.95, 0.922],
  [1.46, 0.945],
  [1.95, 0.925],
  [2.22, 0.865],
  [2.4, 0.78],
])

/** Height (fraction of the section) where the body is widest. */
const shoulder = monotone([
  [-2.4, 0.6],
  [-1.4, 0.65],
  [0.0, 0.66],
  [1.5, 0.63],
  [2.4, 0.56],
])

/** Height of the greenhouse above the belt line. */
const cabinHeight = monotone([
  [-1.64, 0.0],
  [-1.5, 0.09],
  [-1.28, 0.25],
  [-1.0, 0.385],
  [-0.7, 0.462],
  [-0.4, 0.478],
  [-0.15, 0.445],
  [0.1, 0.322],
  [0.38, 0.145],
  [0.62, 0.0],
])

export const CABIN = { x0: -1.64, x1: 0.62, tumble: 0.25, n: 3.2 }

const fadeFront = (x) => smoothstep(1.85, 2.35, x)
const fadeRear = (x) => smoothstep(-1.8, -2.3, x)

/* ------------------------------------------------------------------ */
/* Body section                                                        */
/* ------------------------------------------------------------------ */

export function rawSection(x) {
  const yb = baseBottom(x)
  const yt = topY(x)
  const yc = yb + (yt - yb) * shoulder(x)
  return { yb, yt, yc, hTop: yt - yc, hBot: yc - yb, w: halfWidth(x) }
}

/** Shrinks the section to a point at the very nose and tail (rounded ends). */
export function endFactor(x) {
  const circ = (d, r) => (d >= r ? 1 : Math.sqrt(Math.max(0, 1 - (1 - Math.max(0, d) / r) ** 2)))
  return Math.min(circ(DIM.front - x, DIM.rFront), circ(x - DIM.rear, DIM.rRear))
}

/** Plan-view sweep of the bumper corners. */
function bendX(x, z, w) {
  const q = (z / w) ** 2
  return -DIM.bendFront * fadeFront(x) * q + DIM.bendRear * fadeRear(x) * q
}

/** Point on the (scaled) super-ellipse section. Returns [y, z]. */
function superPoint(s, f, th) {
  const c = Math.cos(th)
  const sn = Math.sin(th)
  const up = sn >= 0
  const n = up ? DIM.nTop : DIM.nBot
  const zN = Math.sign(c) * Math.abs(c) ** (2 / n)
  const yN = Math.sign(sn) * Math.abs(sn) ** (2 / n)
  return [s.yc + f * (up ? s.hTop : s.hBot) * yN, s.w * f * zN * (up ? crease(yN) : 1)]
}

/**
 * Shoulder line: above ~30% of the upper half the side tucks in a little
 * faster, which catches the light like the crease on the real car.
 */
function crease(yN) {
  return 1 - (0.045 * Math.max(0, Math.abs(yN) - 0.3)) / 0.7
}

/** Resamples a 2D parametric curve to `count` points evenly spaced by arc length. */
function resample(fn, a, b, count, closed, samples = 360) {
  const pts = []
  const cum = [0]
  for (let i = 0; i <= samples; i++) {
    const p = fn(lerp(a, b, i / samples))
    if (i) cum.push(cum[i - 1] + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]))
    pts.push(p)
  }
  const total = cum[samples]
  const div = closed ? count : count - 1
  const out = []
  let k = 0
  for (let i = 0; i < count; i++) {
    const target = (total * i) / div
    while (k < samples - 1 && cum[k + 1] < target) k++
    const seg = cum[k + 1] - cum[k]
    const t = seg > 1e-9 ? clamp((target - cum[k]) / seg, 0, 1) : 0
    out.push([lerp(pts[k][0], pts[k + 1][0], t), lerp(pts[k][1], pts[k + 1][1], t)])
  }
  return out
}

const RING = 96

function fullRing(x) {
  const s = rawSection(x)
  const f = endFactor(x)
  return resample((th) => superPoint(s, f, th), 0, Math.PI * 2, RING, true).map(([y, z]) => [
    x + bendX(x, z, s.w),
    y,
    z,
  ])
}

function archY(x) {
  let y = -Infinity
  for (const ax of [DIM.frontAxle, DIM.rearAxle]) {
    const dx = x - ax
    if (Math.abs(dx) <= DIM.archR) y = Math.max(y, DIM.archCY + Math.sqrt(DIM.archR ** 2 - dx * dx))
  }
  return y
}

/**
 * Section clipped by the wheel arch. It reuses the full section's samples and
 * pushes everything below the arch onto a flat "ceiling", so the rings on
 * either side of an arch boundary share their vertices above the arch.
 */
function archRing(x) {
  const ya = archY(x)
  const zA = sideZ(x, ya)
  return fullRing(x).map(([px, y, z]) => (y >= ya ? [px, y, z] : [px, ya, clamp(z, -zA, zA)]))
}

function isCollapsed(ring) {
  const [x0, y0, z0] = ring[0]
  return ring.every(([x, y, z]) => Math.abs(x - x0) + Math.abs(y - y0) + Math.abs(z - z0) < 1e-6)
}

function loft(xs, ringFn) {
  const rings = xs.map(ringFn)
  const N = rings[0].length
  const M = rings.length
  const pos = new Float32Array(M * N * 3)
  rings.forEach((ring, i) => ring.forEach((p, j) => pos.set(p, (i * N + j) * 3)))
  const idx = []
  for (let i = 0; i < M - 1; i++) {
    for (let j = 0; j < N; j++) {
      const j2 = (j + 1) % N
      const a = i * N + j
      const b = i * N + j2
      const c = (i + 1) * N + j
      const d = (i + 1) * N + j2
      idx.push(a, c, b, b, c, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  // A ring collapsed into a single point (nose / tail tip) gets the axis normal.
  const nrm = g.attributes.normal
  ;[
    [0, -1],
    [M - 1, 1],
  ].forEach(([i, sx]) => {
    if (isCollapsed(rings[i])) for (let j = 0; j < N; j++) nrm.setXYZ(i * N + j, sx, 0, 0)
  })
  return { geometry: g, first: rings[0], last: rings[M - 1] }
}

/** Flat fan closing a ring; `facing` = +1 faces +X, -1 faces -X. */
function cap(ring, facing) {
  const c = ring.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0])
  c.forEach((_, k) => (c[k] /= ring.length))
  const pos = []
  for (let j = 0; j < ring.length; j++) {
    const p = ring[j]
    const q = ring[(j + 1) % ring.length]
    if (facing < 0) pos.push(...c, ...p, ...q)
    else pos.push(...c, ...q, ...p)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  const nrm = new Float32Array(pos.length)
  for (let i = 0; i < nrm.length; i += 3) nrm[i] = facing
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3))
  return g
}

function stitchNormals(ga, gb) {
  const pa = ga.attributes.position
  const pb = gb.attributes.position
  const na = ga.attributes.normal
  const nb = gb.attributes.normal
  const offset = pa.count - RING
  const n = new THREE.Vector3()
  for (let j = 0; j < RING; j++) {
    const ia = offset + j
    const d = Math.hypot(pa.getX(ia) - pb.getX(j), pa.getY(ia) - pb.getY(j), pa.getZ(ia) - pb.getZ(j))
    if (d > 2e-3) continue
    n.set(na.getX(ia) + nb.getX(j), na.getY(ia) + nb.getY(j), na.getZ(ia) + nb.getZ(j)).normalize()
    na.setXYZ(ia, n.x, n.y, n.z)
    nb.setXYZ(j, n.x, n.y, n.z)
  }
}

function endStations(end, r, dir, K = 16) {
  // Dense stations near the tip: x = end - dir * r * (1 - cos α)
  return Array.from({ length: K + 1 }, (_, k) => end - dir * r * (1 - Math.cos(((k / K) * Math.PI) / 2)))
}

function uniqueSorted(xs) {
  return [...xs].sort((a, b) => a - b).filter((x, i, arr) => i === 0 || x - arr[i - 1] > 1e-5)
}

export function buildBody() {
  const R = DIM.archR
  const eps = 1e-4
  const fa = DIM.frontAxle
  const ra = DIM.rearAxle

  const s1 = loft(
    uniqueSorted([...endStations(DIM.rear, DIM.rRear, -1), ...range(DIM.rear + DIM.rRear, ra - R, 0.03)]),
    fullRing,
  )
  const s2 = loft(range(ra - R + eps, ra + R - eps, 0.02), archRing)
  const s3 = loft(range(ra + R, fa - R, 0.03), fullRing)
  const s4 = loft(range(fa - R + eps, fa + R - eps, 0.02), archRing)
  const s5 = loft(
    uniqueSorted([...range(fa + R, DIM.front - DIM.rFront, 0.03), ...endStations(DIM.front, DIM.rFront, 1)]),
    fullRing,
  )

  // Each segment computed its own normals; average them where segments meet so
  // the boundaries don't show as creases.
  ;[
    [s1, s2],
    [s2, s3],
    [s3, s4],
    [s4, s5],
  ].forEach(([a, b]) => stitchNormals(a.geometry, b.geometry))

  const paint = mergeGeometries([s1, s2, s3, s4, s5].map((s) => s.geometry))
  // Caps close the body where the arch cuts in: they read as the dark wheel-well walls.
  const wells = mergeGeometries([cap(s1.last, 1), cap(s3.first, -1), cap(s3.last, 1), cap(s5.first, -1)])
  return { paint, wells }
}

/* ------------------------------------------------------------------ */
/* Surface queries (used to place parts on the body)                    */
/* ------------------------------------------------------------------ */

/** Scale factor f at which the section outline passes through (y, z). */
function superNorm(s, y, z) {
  const up = y >= s.yc
  const n = up ? DIM.nTop : DIM.nBot
  const h = up ? s.hTop : s.hBot
  const norm = (f) => {
    const yN = Math.abs(y - s.yc) / (h * f)
    const zN = Math.abs(z) / (s.w * f * (up ? crease(Math.min(1, yN)) : 1))
    return Math.pow(zN ** n + yN ** n, 1 / n)
  }
  let lo = 1e-4
  let hi = 2
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2
    if (norm(mid) > 1) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

function endSurfaceX(y, z, front) {
  const r = front ? DIM.rFront : DIM.rRear
  let d = r * 0.5
  for (let k = 0; k < 8; k++) {
    const x = front ? DIM.front - d : DIM.rear + d
    const rn = superNorm(rawSection(x), y, z)
    const next = rn >= 1 ? r : r * (1 - Math.sqrt(1 - rn * rn))
    const done = Math.abs(next - d) < 1e-5
    d = next
    if (done) break
  }
  const x = front ? DIM.front - d : DIM.rear + d
  return x + bendX(x, z, rawSection(x).w)
}

/** X of the front face at height y / lateral z. */
export const noseX = (y, z) => endSurfaceX(y, z, true)
/** X of the rear face at height y / lateral z. */
export const tailX = (y, z) => endSurfaceX(y, z, false)

/** |Z| of the body side at (x, y). */
export function sideZ(x, y) {
  const s = rawSection(x)
  const f = endFactor(x)
  const up = y >= s.yc
  const n = up ? DIM.nTop : DIM.nBot
  const q = clamp(Math.abs(y - s.yc) / ((up ? s.hTop : s.hBot) * f), 0, 1)
  return s.w * f * Math.pow(1 - q ** n, 1 / n) * (up ? crease(q) : 1)
}

/** Y of the body top surface at (x, z). */
export function topSurfaceY(x, z) {
  const s = rawSection(x)
  const f = endFactor(x)
  // Invert z(yN) of the upper half by bisection.
  let lo = 0
  let hi = 1
  for (let i = 0; i < 30; i++) {
    const yN = (lo + hi) / 2
    const zAt = s.w * f * Math.pow(1 - yN ** DIM.nTop, 1 / DIM.nTop) * crease(yN)
    if (zAt > Math.abs(z)) lo = yN
    else hi = yN
  }
  return s.yc + f * s.hTop * ((lo + hi) / 2)
}

/* ------------------------------------------------------------------ */
/* Cabin                                                                */
/* ------------------------------------------------------------------ */

/** Unit quarter super-ellipse of the cabin section, parametrised by arc length t ∈ [0, 1]. */
const cabinQuarter = (() => {
  const M = 400
  const pts = []
  for (let i = 0; i <= M; i++) {
    const th = (i / M) * (Math.PI / 2)
    pts.push([Math.cos(th) ** (2 / CABIN.n), Math.sin(th) ** (2 / CABIN.n)])
  }
  // Arc length measured on a typical section (0.72 m half width, 0.46 m tall).
  const cum = [0]
  for (let i = 1; i <= M; i++) {
    const za = pts[i - 1][0] * (1 - CABIN.tumble * pts[i - 1][1]) * 0.72
    const zb = pts[i][0] * (1 - CABIN.tumble * pts[i][1]) * 0.72
    cum.push(cum[i - 1] + Math.hypot(zb - za, (pts[i][1] - pts[i - 1][1]) * 0.46))
  }
  const total = cum[M]
  return (t) => {
    const target = clamp(t, 0, 1) * total
    let lo = 0
    let hi = M
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (cum[mid] > target) hi = mid
      else lo = mid
    }
    const u = (target - cum[lo]) / (cum[hi] - cum[lo] || 1)
    return [lerp(pts[lo][0], pts[hi][0], u), lerp(pts[lo][1], pts[hi][1], u)]
  }
})()

function cabinSection(x) {
  const y0 = topY(x) - 0.03
  const s = rawSection(x)
  const q = clamp((y0 - s.yc) / s.hTop, 0, 1)
  const wb = s.w * Math.pow(1 - q ** DIM.nTop, 1 / DIM.nTop) * crease(q) - 0.006
  return { y0, H: Math.max(0, cabinHeight(x)), wb }
}

/**
 * Point on the cabin surface. t ∈ [0, 2]: 0 = right belt line (+Z),
 * 1 = roof centre, 2 = left belt line (−Z).
 */
export function cabinPoint(x, t) {
  const c = cabinSection(x)
  const right = t <= 1
  const [zn, yn] = cabinQuarter(right ? t : 2 - t)
  const z = c.wb * zn * (1 - CABIN.tumble * yn)
  return new THREE.Vector3(x, c.y0 + c.H * yn, right ? z : -z)
}

/* ------------------------------------------------------------------ */
/* Generic surface patch                                               */
/* ------------------------------------------------------------------ */

/**
 * Builds a (nu × nv) grid from map(u, v) → Vector3, orients it so the
 * normals point along outward(p) and lifts it by `offset` along the normals.
 */
export function surfacePatch(map, nu, nv, { offset = 0, outward }) {
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3)
  const uv = new Float32Array((nu + 1) * (nv + 1) * 2)
  for (let i = 0; i <= nu; i++) {
    for (let j = 0; j <= nv; j++) {
      const k = i * (nv + 1) + j
      const p = map(i / nu, j / nv)
      pos.set([p.x, p.y, p.z], k * 3)
      uv.set([i / nu, j / nv], k * 2)
    }
  }
  const idx = []
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j
      const b = a + 1
      const c = a + nv + 1
      const d = c + 1
      idx.push(a, c, b, b, c, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()

  const P = g.attributes.position
  const Nn = g.attributes.normal
  const p = new THREE.Vector3()
  const n = new THREE.Vector3()
  let dot = 0
  for (let k = 0; k < P.count; k++) {
    p.fromBufferAttribute(P, k)
    n.fromBufferAttribute(Nn, k)
    dot += n.dot(outward(p))
  }
  if (dot < 0) {
    for (let k = 0; k < idx.length; k += 3) [idx[k + 1], idx[k + 2]] = [idx[k + 2], idx[k + 1]]
    g.setIndex(idx)
    g.computeVertexNormals()
  }
  if (offset) {
    for (let k = 0; k < P.count; k++) {
      p.fromBufferAttribute(P, k)
      n.fromBufferAttribute(Nn, k)
      p.addScaledVector(n, offset)
      P.setXYZ(k, p.x, p.y, p.z)
    }
    g.computeVertexNormals()
  }
  return g
}

const V = (x, y, z) => new THREE.Vector3(x, y, z)
const OUT_FRONT = () => V(1, 0, 0)
const OUT_REAR = () => V(-1, 0, 0)
const OUT_UP = () => V(0, 1, 0)
const OUT_CABIN = (p) => V(0, p.y - 0.5, p.z)

/** Patch mapped on the cabin: fn(u, v) → [x, t]. */
function cabinPatch(fn, nu, nv, offset) {
  return surfacePatch((u, v) => cabinPoint(...fn(u, v)), nu, nv, { offset, outward: OUT_CABIN })
}

/** Patch projected on the front face: fn(u, v) → [z, y]. */
function frontPatch(fn, nu, nv, offset) {
  return surfacePatch(
    (u, v) => {
      const [z, y] = fn(u, v)
      return V(noseX(y, z), y, z)
    },
    nu,
    nv,
    { offset, outward: OUT_FRONT },
  )
}

/** Patch projected on the rear face: fn(u, v) → [z, y]. */
function rearPatch(fn, nu, nv, offset) {
  return surfacePatch(
    (u, v) => {
      const [z, y] = fn(u, v)
      return V(tailX(y, z), y, z)
    },
    nu,
    nv,
    { offset, outward: OUT_REAR },
  )
}

/** Patch projected on a body side: fn(u, v) → [x, y]; side = ±1. */
function sidePatch(fn, nu, nv, offset, side) {
  return surfacePatch(
    (u, v) => {
      const [x, y] = fn(u, v)
      return V(x, y, side * sideZ(x, y))
    },
    nu,
    nv,
    { offset, outward: () => V(0, 0, side) },
  )
}

/** Same patch on both sides of the car (mirrored in Z). */
const both = (make) => [make(1), make(-1)]
const mirrorZ = (fn, s) => (u, v) => {
  const [z, y] = fn(u, v)
  return [z * s, y]
}

/* ------------------------------------------------------------------ */
/* Full car                                                             */
/* ------------------------------------------------------------------ */

export function buildCarGeometry() {
  const body = buildBody()

  /* Cabin base (painted A/C pillars and roof rails). */
  const cabin = surfacePatch((u, v) => cabinPoint(lerp(CABIN.x0, CABIN.x1, u), v * 2), 90, 72, {
    outward: OUT_CABIN,
  })

  /* Glass */
  const sideRearEdge = monotone([
    [0, -1.2],
    [0.16, -1.31],
    [0.32, -1.27],
    [1, -0.93],
  ])
  const sideWindow = (side) =>
    cabinPatch(
      (u, v) => {
        const t = lerp(0.035, 0.375, v)
        return [lerp(sideRearEdge(v), 0.6, u), side > 0 ? t : 2 - t]
      },
      60,
      16,
      0.004,
    )
  const glass = mergeGeometries([
    cabinPatch((u, v) => [lerp(-0.1, 0.62, u), lerp(0.43, 1.57, v)], 40, 48, 0.004), // windscreen
    cabinPatch((u, v) => [lerp(-1.64, -0.98, u), lerp(0.45, 1.55, v)], 40, 48, 0.004), // rear window
    ...both(sideWindow),
  ])

  /* Carbon-fibre roof (standard on the Competition). */
  const roof = cabinPatch((u, v) => [lerp(-0.98, -0.1, u), lerp(0.405, 1.595, v)], 40, 48, 0.005)

  /* Gloss-black trim: B-pillars, window surrounds, belt-line trim, side gills. */
  const gloss = mergeGeometries([
    ...both((s) =>
      cabinPatch(
        (u, v) => {
          const t = lerp(0.372, 0.405, v)
          return [lerp(-1.0, 0.0, u), s > 0 ? t : 2 - t]
        },
        30,
        2,
        0.006,
      ),
    ),
    ...both((s) =>
      cabinPatch(
        (u, v) => {
          const t = lerp(0.0, 0.39, v)
          return [lerp(-0.6, -0.55, u), s > 0 ? t : 2 - t]
        },
        4,
        12,
        0.008,
      ),
    ),
    ...both((s) =>
      cabinPatch(
        (u, v) => {
          const t = lerp(0.008, 0.034, v)
          return [lerp(-1.2, 0.5, u), s > 0 ? t : 2 - t]
        },
        40,
        2,
        0.006,
      ),
    ),
    ...both((s) =>
      sidePatch((u, v) => [lerp(0.86, 1.05, u), lerp(0.56, 0.6, v) + u * 0.022], 12, 3, 0.004, s),
    ),
  ])

  /* Matte black: intakes, diffuser, side skirts. */
  const matte = mergeGeometries([
    // lower centre intake
    frontPatch((u, v) => [lerp(-0.32, 0.32, u), lerp(0.19, 0.25, v)], 24, 4, 0.004),
    // corner intakes
    ...both((s) =>
      frontPatch(
        mirrorZ((u, v) => {
          const z = lerp(0.36, 0.64, u)
          return [z, lerp(0.21 + 0.03 * u, 0.37 - 0.07 * u, v)]
        }, s),
        24,
        8,
        0.004,
      ),
    ),
    // rear diffuser
    rearPatch((u, v) => [lerp(-0.66, 0.66, u), lerp(0.24, 0.36, v)], 40, 6, 0.004),
    // side skirts
    ...both((s) => sidePatch((u, v) => [lerp(-0.96, 1.04, u), lerp(0.175, 0.26, v)], 40, 6, 0.005, s)),
  ])

  /* Head lights: dark housing, LED daytime running light strip, laser-blue accent. */
  const headHousing = (u, v) => {
    const z = lerp(0.31, 0.78, u ** 0.85)
    return [z, lerp(lerp(0.575, 0.612, u), lerp(0.655, 0.672, u), v)]
  }
  const headGlass = mergeGeometries(both((s) => frontPatch(mirrorZ(headHousing, s), 36, 6, 0.005)))
  const drl = mergeGeometries([
    ...both((s) =>
      frontPatch(
        mirrorZ((u, v) => {
          const z = lerp(0.36, 0.76, u ** 0.85)
          const top = lerp(0.648, 0.664, u)
          return [z, lerp(top - 0.012, top, v)]
        }, s),
        30,
        2,
        0.009,
      ),
    ),
    // inner vertical stroke of the L-shaped daytime running light
    ...both((s) =>
      frontPatch(
        mirrorZ((u, v) => [lerp(0.36, 0.372, u), lerp(0.6, 0.652, v)], s),
        2,
        6,
        0.009,
      ),
    ),
    // lower light tube
    ...both((s) =>
      frontPatch(
        mirrorZ((u, v) => {
          const z = lerp(0.42, 0.7, u)
          return [z, lerp(0.598, 0.605, v) + u * 0.014]
        }, s),
        20,
        2,
        0.009,
      ),
    ),
  ])
  const laser = mergeGeometries(
    both((s) =>
      frontPatch(
        mirrorZ((u, v) => [lerp(0.66, 0.74, u), lerp(0.612, 0.622, v) + u * 0.004], s),
        6,
        2,
        0.009,
      ),
    ),
  )

  /* Tail lights. */
  const tailHousing = (u, v) => {
    const z = lerp(0.38, 0.74, u ** 0.8)
    return [z, lerp(lerp(0.83, 0.84, u), lerp(0.905, 0.925, u), v)]
  }
  const tailGlass = mergeGeometries(both((s) => rearPatch(mirrorZ(tailHousing, s), 30, 6, 0.005)))
  const tailLight = mergeGeometries([
    // horizontal light bar
    ...both((s) =>
      rearPatch(
        mirrorZ((u, v) => {
          const z = lerp(0.42, 0.72, u ** 0.8)
          return [z, lerp(0.885, 0.9, v) + u * 0.012]
        }, s),
        24,
        2,
        0.009,
      ),
    ),
    // vertical stroke of the "L"
    ...both((s) =>
      rearPatch(
        mirrorZ((u, v) => [lerp(0.66, 0.68, u), lerp(0.85, 0.905, v)], s),
        2,
        6,
        0.009,
      ),
    ),
  ])

  /* Carbon parts: boot-lid spoiler and front splitter. */
  const lipStart = -2.1
  const lipEnd = -2.27
  const lipH = (x) => 0.032 * smoothstep(lipStart, lipEnd, x)
  const spoilerTop = surfacePatch(
    (u, v) => {
      const x = lerp(lipStart, lipEnd, u)
      const z = lerp(-0.66, 0.66, v)
      return V(x, topSurfaceY(x, z) + lipH(x), z)
    },
    16,
    40,
    { offset: 0.002, outward: OUT_UP },
  )
  const spoilerBack = surfacePatch(
    (u, v) => {
      const z = lerp(-0.66, 0.66, v)
      return V(lipEnd, topSurfaceY(lipEnd, z) + lipH(lipEnd) * u + 0.002, z)
    },
    2,
    40,
    { outward: OUT_REAR },
  )
  const splitter = splitterGeometry()

  return {
    body: body.paint,
    wells: body.wells,
    cabin,
    glass,
    roof,
    gloss,
    matte,
    headGlass,
    drl,
    laser,
    tailGlass,
    tailLight,
    carbon: mergeGeometries([spoilerTop.toNonIndexed(), spoilerBack.toNonIndexed(), splitter]),
  }
}

/** Thin front splitter following the plan-view outline of the bumper. */
function splitterGeometry() {
  const y = 0.155
  const shape = new THREE.Shape()
  const zs = range(-0.82, 0.82, 0.04)
  // Shape is drawn in (x, -z) and extruded along +Y after rotation.
  zs.forEach((z, i) => {
    const x = noseX(0.19, z) + 0.035
    if (i === 0) shape.moveTo(x, -z)
    else shape.lineTo(x, -z)
  })
  ;[...zs].reverse().forEach((z) => shape.lineTo(noseX(0.19, z) - 0.25, -z))
  shape.closePath()
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false, curveSegments: 1 })
  g.rotateX(-Math.PI / 2)
  g.translate(0, y - 0.02, 0)
  return stripToPositionNormal(g)
}

/** Keeps only position/normal/uv attributes so geometries can be merged. */
function stripToPositionNormal(g) {
  const out = g.index ? g.toNonIndexed() : g
  const keep = ['position', 'normal', 'uv']
  Object.keys(out.attributes).forEach((k) => !keep.includes(k) && out.deleteAttribute(k))
  if (!out.attributes.uv) {
    out.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(out.attributes.position.count * 2), 2))
  }
  out.clearGroups()
  return out
}
