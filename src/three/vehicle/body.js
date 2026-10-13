/*
 * Parametric car body. A spec (see specs.js) describes the side profile,
 * plan-view width, section shape and greenhouse; this module turns it into
 * surfaces plus query/projection helpers used to place details on them.
 *
 * Units are metres, the car points to +X, Y is up, Z is across.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  cap,
  clamp,
  lerp,
  loft,
  monotone,
  range,
  resample,
  smoothstep,
  stitchNormals,
  surfacePatch,
  uniqueSorted,
} from './kit.js'

const RING = 112
const V = (x, y, z) => new THREE.Vector3(x, y, z)

export function createBody(spec) {
  const S = spec
  const front = S.length / 2
  const rear = -S.length / 2
  const topY = monotone(S.top)
  const baseBottom = monotone(S.bottom)
  const halfWidth = monotone(S.halfWidth)
  const shoulder = monotone(S.shoulder)
  const cabinHeight = monotone(S.cabin.height)
  const nTop = S.nTop ?? 6
  const nBot = S.nBot ?? 10
  const creaseAt = S.crease?.at ?? 0.3
  const creaseAmt = S.crease?.amount ?? 0.04
  const axles = [S.frontAxle, S.rearAxle]

  const fadeFront = (x) => smoothstep(S.frontAxle + S.archR + 0.02, front - 0.05, x)
  const fadeRear = (x) => smoothstep(S.rearAxle - S.archR - 0.02, rear + 0.05, x)

  /* ---------- section ---------- */

  function rawSection(x) {
    const yb = baseBottom(x)
    const yt = topY(x)
    const yc = yb + (yt - yb) * shoulder(x)
    return { yb, yt, yc, hTop: yt - yc, hBot: yc - yb, w: halfWidth(x) }
  }

  function endFactor(x) {
    const circ = (d, r) => (d >= r ? 1 : Math.sqrt(Math.max(0, 1 - (1 - Math.max(0, d) / r) ** 2)))
    return Math.min(circ(front - x, S.rFront), circ(x - rear, S.rRear))
  }

  function bendX(x, z, w) {
    const q = (z / w) ** 2
    return -S.bendFront * fadeFront(x) * q + S.bendRear * fadeRear(x) * q
  }

  const crease = (yN) => 1 - (creaseAmt * Math.max(0, Math.abs(yN) - creaseAt)) / (1 - creaseAt)
  // A shallow groove across the doors (lower character line).
  const grooveAt = S.groove?.at ?? 0.45
  const grooveAmt = S.groove?.amount ?? 0
  const groove = (yN) => 1 - grooveAmt * Math.exp(-(((Math.abs(yN) - grooveAt) / 0.08) ** 2))

  function superPoint(s, f, th) {
    const c = Math.cos(th)
    const sn = Math.sin(th)
    const up = sn >= 0
    const n = up ? nTop : nBot
    const zN = Math.sign(c) * Math.abs(c) ** (2 / n)
    const yN = Math.sign(sn) * Math.abs(sn) ** (2 / n)
    return [s.yc + f * (up ? s.hTop : s.hBot) * yN, s.w * f * zN * (up ? crease(yN) : groove(yN))]
  }

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
    for (const ax of axles) {
      const dx = x - ax
      if (Math.abs(dx) <= S.archR) y = Math.max(y, S.archCY + Math.sqrt(S.archR ** 2 - dx * dx))
    }
    return y
  }

  function archRing(x) {
    const ya = archY(x)
    const zA = sideZ(x, ya)
    return fullRing(x).map(([px, y, z]) => (y >= ya ? [px, y, z] : [px, ya, clamp(z, -zA, zA)]))
  }

  function endStations(end, r, dir, K = 16) {
    return Array.from({ length: K + 1 }, (_, k) => end - dir * r * (1 - Math.cos(((k / K) * Math.PI) / 2)))
  }

  function buildBody() {
    const R = S.archR
    const eps = 1e-4
    const [fa, ra] = axles
    const s1 = loft(uniqueSorted([...endStations(rear, S.rRear, -1), ...range(rear + S.rRear, ra - R, 0.03)]), fullRing)
    const s2 = loft(range(ra - R + eps, ra + R - eps, 0.02), archRing)
    const s3 = loft(range(ra + R, fa - R, 0.03), fullRing)
    const s4 = loft(range(fa - R + eps, fa + R - eps, 0.02), archRing)
    const s5 = loft(uniqueSorted([...range(fa + R, front - S.rFront, 0.03), ...endStations(front, S.rFront, 1)]), fullRing)
    ;[
      [s1, s2],
      [s2, s3],
      [s3, s4],
      [s4, s5],
    ].forEach(([a, b]) => stitchNormals(a, b))
    return {
      paint: mergeGeometries([s1, s2, s3, s4, s5].map((s) => s.geometry)),
      wells: mergeGeometries([cap(s1.last, 1), cap(s3.first, -1), cap(s3.last, 1), cap(s5.first, -1)]),
    }
  }

  /* ---------- queries ---------- */

  function superNorm(s, y, z) {
    const up = y >= s.yc
    const n = up ? nTop : nBot
    const h = up ? s.hTop : s.hBot
    const norm = (f) => {
      const yN = Math.abs(y - s.yc) / (h * f)
      const zN = Math.abs(z) / (s.w * f * (up ? crease(Math.min(1, yN)) : groove(Math.min(1, yN))))
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

  function endSurfaceX(y, z, isFront) {
    const r = isFront ? S.rFront : S.rRear
    let d = r * 0.5
    for (let k = 0; k < 8; k++) {
      const x = isFront ? front - d : rear + d
      const rn = superNorm(rawSection(x), y, z)
      const next = rn >= 1 ? r : r * (1 - Math.sqrt(1 - rn * rn))
      const done = Math.abs(next - d) < 1e-5
      d = next
      if (done) break
    }
    const x = isFront ? front - d : rear + d
    return x + bendX(x, z, rawSection(x).w)
  }

  const noseX = (y, z) => endSurfaceX(y, z, true)
  const tailX = (y, z) => endSurfaceX(y, z, false)

  function sideZ(x, y) {
    const s = rawSection(x)
    const f = endFactor(x)
    const up = y >= s.yc
    const n = up ? nTop : nBot
    const q = clamp(Math.abs(y - s.yc) / ((up ? s.hTop : s.hBot) * f), 0, 1)
    return s.w * f * Math.pow(1 - q ** n, 1 / n) * (up ? crease(q) : groove(q))
  }

  function topSurfaceY(x, z) {
    const s = rawSection(x)
    const f = endFactor(x)
    let lo = 0
    let hi = 1
    for (let i = 0; i < 30; i++) {
      const yN = (lo + hi) / 2
      const zAt = s.w * f * Math.pow(1 - yN ** nTop, 1 / nTop) * crease(yN)
      if (zAt > Math.abs(z)) lo = yN
      else hi = yN
    }
    return s.yc + f * s.hTop * ((lo + hi) / 2)
  }

  /* ---------- greenhouse ---------- */

  const C = S.cabin
  const cabinQuarter = (() => {
    const M = 400
    const pts = []
    for (let i = 0; i <= M; i++) {
      const th = (i / M) * (Math.PI / 2)
      pts.push([Math.cos(th) ** (2 / C.n), Math.sin(th) ** (2 / C.n)])
    }
    const W = C.typicalWidth ?? 0.78
    const H = C.typicalHeight ?? 0.55
    const cum = [0]
    for (let i = 1; i <= M; i++) {
      const za = pts[i - 1][0] * (1 - C.tumble * pts[i - 1][1]) * W
      const zb = pts[i][0] * (1 - C.tumble * pts[i][1]) * W
      cum.push(cum[i - 1] + Math.hypot(zb - za, (pts[i][1] - pts[i - 1][1]) * H))
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
    const y0 = topY(x) - (C.beltDrop ?? 0.03)
    const s = rawSection(x)
    const q = clamp((y0 - s.yc) / s.hTop, 0, 1)
    const wb = s.w * Math.pow(1 - q ** nTop, 1 / nTop) * crease(q) - 0.006
    return { y0, H: Math.max(0, cabinHeight(x)), wb }
  }

  /** t ∈ [0, 2]: 0 = right belt line (+Z), 1 = roof centre, 2 = left belt line. */
  function cabinPoint(x, t) {
    const c = cabinSection(x)
    const right = t <= 1
    const [zn, yn] = cabinQuarter(right ? t : 2 - t)
    const z = c.wb * zn * (1 - C.tumble * yn)
    return V(x, c.y0 + c.H * yn, right ? z : -z)
  }

  function buildCabin() {
    return surfacePatch((u, v) => cabinPoint(lerp(C.x0, C.x1, u), v * 2), 110, 80, {
      outward: (p) => V(0, p.y - 0.5, p.z),
    })
  }

  /* ---------- patch helpers ---------- */

  const OUT_CABIN = (p) => V(0, p.y - 0.5, p.z)
  const api = {
    spec: S,
    front,
    rear,
    rawSection,
    topY,
    noseX,
    tailX,
    sideZ,
    topSurfaceY,
    cabinPoint,
    cabinSection,
    buildBody,
    buildCabin,
    /** fn(u, v) → [x, t] on the greenhouse. */
    cabinPatch: (fn, nu, nv, offset = 0) =>
      surfacePatch((u, v) => cabinPoint(...fn(u, v)), nu, nv, { offset, outward: OUT_CABIN }),
    /** fn(u, v) → [z, y] projected on the nose. */
    frontPatch: (fn, nu, nv, offset = 0) =>
      surfacePatch(
        (u, v) => {
          const [z, y] = fn(u, v)
          return V(noseX(y, z), y, z)
        },
        nu,
        nv,
        { offset, outward: () => V(1, 0, 0) },
      ),
    /** fn(u, v) → [z, y] projected on the tail. */
    rearPatch: (fn, nu, nv, offset = 0) =>
      surfacePatch(
        (u, v) => {
          const [z, y] = fn(u, v)
          return V(tailX(y, z), y, z)
        },
        nu,
        nv,
        { offset, outward: () => V(-1, 0, 0) },
      ),
    /** fn(u, v) → [x, y] projected on the side `s` (±1). */
    sidePatch: (fn, nu, nv, offset, s) =>
      surfacePatch(
        (u, v) => {
          const [x, y] = fn(u, v)
          return V(x, y, s * sideZ(x, y))
        },
        nu,
        nv,
        { offset, outward: () => V(0, 0, s) },
      ),
    /** fn(u, v) → [x, z] projected on the top surface (hood / boot). */
    topPatch: (fn, nu, nv, offset = 0) =>
      surfacePatch(
        (u, v) => {
          const [x, z] = fn(u, v)
          return V(x, topSurfaceY(x, z), z)
        },
        nu,
        nv,
        { offset, outward: () => V(0, 1, 0) },
      ),
  }
  return api
}
