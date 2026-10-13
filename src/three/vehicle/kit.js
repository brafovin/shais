/*
 * Small geometry toolkit shared by the procedural vehicles: interpolation,
 * lofting cross-sections, and surface patches ("decals") that follow a body.
 */
import * as THREE from 'three'

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const smoothstep = (a, b, x) => {
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

export function range(a, b, step) {
  const n = Math.max(1, Math.ceil(Math.abs(b - a) / step))
  return Array.from({ length: n + 1 }, (_, i) => lerp(a, b, i / n))
}

export function uniqueSorted(xs) {
  return [...xs].sort((a, b) => a - b).filter((x, i, arr) => i === 0 || x - arr[i - 1] > 1e-5)
}

/** Resamples a 2D parametric curve to `count` points evenly spaced by arc length. */
export function resample(fn, a, b, count, closed, samples = 360) {
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

function isCollapsed(ring) {
  const [x0, y0, z0] = ring[0]
  return ring.every(([x, y, z]) => Math.abs(x - x0) + Math.abs(y - y0) + Math.abs(z - z0) < 1e-6)
}

/** Lofts closed rings (arrays of [x, y, z]) produced by ringFn at each station. */
export function loft(xs, ringFn) {
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
  const nrm = g.attributes.normal
  ;[
    [0, -1],
    [M - 1, 1],
  ].forEach(([i, sx]) => {
    if (isCollapsed(rings[i])) for (let j = 0; j < N; j++) nrm.setXYZ(i * N + j, sx, 0, 0)
  })
  return { geometry: g, first: rings[0], last: rings[M - 1], N }
}

/** Flat fan closing a ring; `facing` = +1 faces +X, -1 faces -X. */
export function cap(ring, facing) {
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

/** Averages the normals of the last ring of `a` and the first ring of `b` where they coincide. */
export function stitchNormals(a, b) {
  const pa = a.geometry.attributes.position
  const pb = b.geometry.attributes.position
  const na = a.geometry.attributes.normal
  const nb = b.geometry.attributes.normal
  const N = a.N
  const offset = pa.count - N
  const n = new THREE.Vector3()
  for (let j = 0; j < N; j++) {
    const ia = offset + j
    const d = Math.hypot(pa.getX(ia) - pb.getX(j), pa.getY(ia) - pb.getY(j), pa.getZ(ia) - pb.getZ(j))
    if (d > 2e-3) continue
    n.set(na.getX(ia) + nb.getX(j), na.getY(ia) + nb.getY(j), na.getZ(ia) + nb.getZ(j)).normalize()
    na.setXYZ(ia, n.x, n.y, n.z)
    nb.setXYZ(j, n.x, n.y, n.z)
  }
}

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

/**
 * For a closed polygon [[a, b], ...] returns the [min, max] of b where the
 * line a = const crosses it (the polygon must be convex along b).
 */
function polygonSpan(poly, a) {
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < poly.length; i++) {
    const [a0, b0] = poly[i]
    const [a1, b1] = poly[(i + 1) % poly.length]
    if ((a >= Math.min(a0, a1) && a <= Math.max(a0, a1)) && a0 !== a1) {
      const b = b0 + ((a - a0) / (a1 - a0)) * (b1 - b0)
      lo = Math.min(lo, b)
      hi = Math.max(hi, b)
    } else if (a0 === a1 && Math.abs(a - a0) < 1e-9) {
      lo = Math.min(lo, b0, b1)
      hi = Math.max(hi, b0, b1)
    }
  }
  return lo === Infinity ? null : [lo, hi]
}

/**
 * (u, v) parametrisation of a polygon given in 2D surface coordinates [a, b]:
 * u sweeps a from its min to its max, v spans b inside the polygon.
 */
export function polygonParam(poly) {
  const as = poly.map((p) => p[0])
  const a0 = Math.min(...as) + 1e-6
  const a1 = Math.max(...as) - 1e-6
  return (u, v) => {
    const a = lerp(a0, a1, u)
    const span = polygonSpan(poly, a) ?? [0, 0]
    return [a, lerp(span[0], span[1], v)]
  }
}

/** (u, v) parametrisation of a band of `width` along a 2D polyline. */
export function stripParam(points, width) {
  const cum = [0]
  for (let i = 1; i < points.length; i++)
    cum.push(cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]))
  const total = cum[cum.length - 1]
  return (u, v) => {
    const target = u * total
    let i = 0
    while (i < points.length - 2 && cum[i + 1] < target) i++
    const seg = cum[i + 1] - cum[i] || 1
    const t = (target - cum[i]) / seg
    const [a0, b0] = points[i]
    const [a1, b1] = points[i + 1]
    const da = (a1 - a0) / seg
    const db = (b1 - b0) / seg
    const off = (v - 0.5) * width
    return [lerp(a0, a1, t) - db * off, lerp(b0, b1, t) + da * off]
  }
}

/** Strips every attribute but position/normal/uv so geometries can be merged. */
export function clean(g) {
  const out = g.index ? g.toNonIndexed() : g
  Object.keys(out.attributes).forEach((k) => !['position', 'normal', 'uv'].includes(k) && out.deleteAttribute(k))
  if (!out.attributes.uv) {
    out.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(out.attributes.position.count * 2), 2))
  }
  out.clearGroups()
  return out
}
