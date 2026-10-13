/*
 * Procedural 3D specs for the BMW X family. Dimensions follow the real cars
 * (length, width, height, wheelbase, wheel size); styling cues (kidneys, lamp
 * graphics, trims, wheels, paint) follow reference photos of each model.
 */
import * as THREE from 'three'
import { lerp, monotone } from './kit.js'
import {
  exhausts,
  frontPoly,
  frontStrip,
  greenhouse,
  kidneys,
  mirrors,
  rearPoly,
  rearStrip,
  roofRails,
  roundel,
  sides,
} from './parts.js'

/**
 * Builds a body spec from a few key measurements.
 * roof: 'sav' (upright tailgate) or 'coupe' (fastback, X2/X6 style).
 */
function suv(p) {
  const front = p.L / 2
  const rear = -p.L / 2
  const fa = front - p.fo
  const ra = fa - p.wb
  const W = p.W / 2 - 0.01
  const R = p.R
  const archR = R + 0.05
  const clear = p.clearance ?? 0.2

  const top = [
    [rear, p.tailTop - 0.09],
    [rear + 0.05, p.tailTop - 0.025],
    [rear + 0.16, p.tailTop],
    [ra, p.beltRear],
    [ra + p.wb * 0.45, p.belt],
    [fa - p.wsBack, p.cowl],
    [fa, lerp(p.cowl, p.noseTop, 0.55)],
    [front - 0.24, p.noseTop + 0.035],
    [front - 0.07, p.noseTop],
    [front, p.noseTop - 0.05],
  ]
  const topY = monotone(top)
  const beltDrop = 0.03
  const y0 = (x) => topY(x) - beltDrop

  const x1 = fa - p.wsBack + 0.02 // windscreen base
  const roofFront = x1 - p.wsRun
  const x0 = p.roof === 'coupe' ? rear + p.deck : rear + (p.tailInset ?? 0.12)
  const H = p.H - (p.rails ? 0.04 : 0)

  // Absolute roof line → greenhouse height above the belt.
  const roofAbs =
    p.roof === 'coupe'
      ? [
          [x0, y0(x0)],
          [x0 + 0.2, lerp(y0(x0), H, 0.42)],
          [x0 + 0.55, lerp(y0(x0), H, 0.76)],
          [x0 + 1.0, H - 0.05],
          [roofFront - 0.55, H],
          [roofFront, H - 0.02],
          [roofFront + p.wsRun * 0.45, lerp(H, y0(x1), 0.42)],
          [x1, y0(x1)],
        ]
      : [
          [x0, y0(x0)],
          [x0 + 0.06, H - 0.24],
          [x0 + 0.16, H - 0.07],
          [x0 + 0.34, H - 0.02],
          [roofFront - 0.6, H],
          [roofFront, H - 0.015],
          [roofFront + p.wsRun * 0.45, lerp(H, y0(x1), 0.42)],
          [x1, y0(x1)],
        ]
  const height = roofAbs.map(([x, y]) => [x, Math.max(0, y - y0(x))])

  const rearTop = p.roof === 'coupe' ? x0 + 0.85 : x0 + 0.3
  const bX = ra + p.wb * (p.bPillar ?? 0.5)
  const cX = ra + (p.cPillar ?? 0.12)

  return {
    ...p,
    length: p.L,
    frontAxle: fa,
    rearAxle: ra,
    archR,
    archCY: R + 0.025,
    track: W - p.tireW / 2 - 0.012,
    rFront: p.rFront ?? 0.11,
    rRear: p.rRear ?? 0.1,
    bendFront: p.bendFront ?? 0.22,
    bendRear: p.bendRear ?? 0.12,
    nTop: p.nTop ?? 8,
    nBot: p.nBot ?? 12,
    crease: { at: 0.3, amount: p.crease ?? 0.035 },
    groove: { at: 0.42, amount: p.groove ?? 0.012 },
    top,
    bottom: [
      [rear, p.rearBottom ?? 0.36],
      [rear + 0.32, clear + 0.06],
      [ra, clear],
      [fa, clear],
      [front - 0.32, clear + 0.04],
      [front, p.frontBottom ?? 0.3],
    ],
    halfWidth: [
      [rear, W * 0.85],
      [rear + 0.16, W * 0.93],
      [ra - archR - 0.05, W * 0.965],
      [ra, W],
      [ra + archR + 0.12, W * 0.965],
      [ra + p.wb * 0.5, W * 0.955],
      [fa - archR - 0.12, W * 0.962],
      [fa, W * 0.995],
      [fa + archR + 0.05, W * 0.965],
      [front - 0.13, W * 0.92],
      [front, W * 0.83],
    ],
    shoulder: [
      [rear, 0.64],
      [0, p.shoulder ?? 0.68],
      [front, 0.6],
    ],
    cabin: {
      x0,
      x1,
      tumble: p.tumble ?? 0.16,
      n: 3.6,
      beltDrop,
      height,
      typicalWidth: W * 0.85,
      typicalHeight: H - p.belt,
    },
    glass: {
      windscreen: [roofFront + 0.03, x1],
      screenT: 0.43,
      rear: [x0, rearTop],
      rearT: 0.44,
      sideFront: x1 - 0.05,
      sideTop: 0.37,
      sideRear: p.sideRear ?? [
        [0, cX - 0.36],
        [0.14, cX - 0.42],
        [0.32, cX - 0.38],
        [1, cX - 0.18],
      ],
      pillars: p.pillars ?? [
        [bX - 0.04, bX + 0.04],
        [cX - 0.03, cX + 0.03],
      ],
      roof: p.roofPanel ?? { x0: roofFront + 0.12, x1: rearTop + 0.15, t: 0.5, material: 'glass' },
      surround: p.surround ?? 'black',
    },
    layout: { front, rear, fa, ra, x0, x1, roofFront, rearTop, bX, cX, W, R, archR, clear },
  }
}

/** Shared side details: rails, mirrors, door lines, handles, sills, greenhouse. */
function commonDetails(body, add, opts = {}) {
  const s = body.spec
  const L = s.layout
  greenhouse(body, add)
  // Roundels on the bonnet nose and the tailgate.
  const yHood = body.topSurfaceY(L.front - 0.16, 0)
  roundel(add, new THREE.Vector3(L.front - 0.16, yHood, 0), new THREE.Vector3(0.55, 1, 0), 0.042)
  const yTail = s.tailTop - 0.12
  roundel(add, new THREE.Vector3(body.tailX(yTail, 0), yTail, 0), new THREE.Vector3(-1, 0.1, 0), 0.04)
  if (s.rails) roofRails(body, add, { x0: L.rearTop + 0.08, x1: L.roofFront - 0.05 })
  mirrors(body, add, { x: L.x1 - 0.14, material: opts.mirror ?? 'black' })
  const belt = s.belt - 0.05
  const sill = L.clear + 0.13
  sides(body, add, {
    lines: [
      [
        [L.fa - L.archR - 0.04, sill],
        [L.fa - L.archR - 0.08, belt - 0.2],
        [L.x1 - 0.06, belt],
      ],
      [
        [L.bX, sill],
        [L.bX, belt],
      ],
      [
        [L.ra + L.archR * 0.55, belt],
        [L.ra + L.archR * 0.98, L.R + L.archR * 0.75],
        [L.ra + L.archR + 0.05, sill],
      ],
    ],
    handles: [
      [L.bX - 0.32, belt - 0.07],
      [L.cX + 0.2, belt - 0.07],
    ],
    sill: [L.ra + L.archR + 0.02, L.fa - L.archR - 0.02, L.clear + 0.015, L.clear + 0.1],
    handleMaterial: opts.handle ?? 'chrome',
  })
}

/* ------------------------------------------------------------------ */
/* Model specs                                                          */
/* ------------------------------------------------------------------ */

export const X_SPECS = {
  /* BMW X1 (U11) M Sport — Alpine White, black kidneys with vertical bars. */
  x1: {
    ...suv({
      L: 4.5, W: 1.845, H: 1.642, wb: 2.692, fo: 0.86,
      R: 0.352, tireW: 0.245, rimR: 0.245, wheel: 'y',
      noseTop: 0.9, cowl: 1.02, belt: 1.03, beltRear: 1.06, tailTop: 1.02,
      wsBack: 0.7, wsRun: 0.92, rails: true, roof: 'sav', tailInset: 0.13,
    }),
    paint: { hex: '#eceeed', metallic: false },
    rim: { color: '#2b2d31', face: '#c9ccd1' },
    caliper: '#2a2c30',
    grilleTexture: 'barsV',
    front(body, add) {
      kidneys(body, add, {
        outline: [
          [0.012, -0.17],
          [0.29, -0.15],
          [0.3, 0.13],
          [0.27, 0.17],
          [0.012, 0.17],
        ],
        radius: [0.03, 0.07, 0.06, 0.05, 0.02],
        yc: 0.66,
        frameKey: 'black',
        innerKey: 'grille',
        frame: 0.022,
      })
      // Headlights: slim, rising towards the outside.
      frontPoly(body, add, 'lamp', [
        [0.32, 0.77], [0.8, 0.8], [0.83, 0.885], [0.36, 0.865],
      ])
      frontPoly(body, add, 'lampGlass', [[0.44, 0.795], [0.54, 0.8], [0.54, 0.835], [0.44, 0.83]], { offset: 0.007 })
      frontStrip(body, add, 'drl', [[0.38, 0.84], [0.62, 0.852], [0.78, 0.866]], 0.012)
      frontStrip(body, add, 'drl', [[0.58, 0.812], [0.6, 0.845]], 0.01)
      frontStrip(body, add, 'drl', [[0.7, 0.82], [0.72, 0.855]], 0.01)
      // Lower intake (hexagonal) and corner air curtains.
      frontPoly(body, add, 'mesh', [[-0.56, 0.32], [0.56, 0.32], [0.62, 0.43], [0.5, 0.5], [-0.5, 0.5], [-0.62, 0.43]], { centre: true, nu: 40 })
      frontPoly(body, add, 'black', [[0.62, 0.33], [0.72, 0.36], [0.74, 0.62], [0.66, 0.6]], { nu: 12 })
      frontPoly(body, add, 'black', [[-0.5, 0.27], [0.5, 0.27], [0.5, 0.3], [-0.5, 0.3]], { centre: true, nu: 20, nv: 2 })
    },
    rear(body, add) {
      rearPoly(body, add, 'tailGlass', [[0.42, 0.98], [0.86, 0.99], [0.86, 1.04], [0.45, 1.05]])
      rearStrip(body, add, 'tail', [[0.47, 1.015], [0.8, 1.02], [0.83, 0.995]], 0.014)
      rearPoly(body, add, 'black', [[-0.62, 0.36], [0.62, 0.36], [0.6, 0.45], [-0.6, 0.45]], { centre: true })
    },
    details: (body, add) => commonDetails(body, add, { mirror: 'black' }),
  },

  /* BMW X2 (U10) — Black Sapphire coupé-SUV, diamond-mesh kidneys. */
  x2: {
    ...suv({
      L: 4.554, W: 1.845, H: 1.59, wb: 2.692, fo: 0.87,
      R: 0.352, tireW: 0.245, rimR: 0.255, wheel: 'y',
      noseTop: 0.88, cowl: 1.0, belt: 1.01, beltRear: 1.05, tailTop: 1.03,
      wsBack: 0.7, wsRun: 0.95, roof: 'coupe', deck: 0.32,
      sideRear: [
        [0, -1.42], [0.2, -1.46], [0.45, -1.38], [1, -1.05],
      ],
      pillars: [[-0.06, 0.02]],
      roofPanel: { x0: -0.6, x1: 0.35, t: 0.5, material: 'glass' },
    }),
    paint: { hex: '#0c0e12', metallic: true },
    rim: { color: '#26282c', face: '#cfd2d6' },
    caliper: '#1f55d8',
    grilleTexture: 'diamond',
    front(body, add) {
      kidneys(body, add, {
        outline: [
          [0.015, -0.12],
          [0.27, -0.13],
          [0.3, 0.06],
          [0.25, 0.13],
          [0.015, 0.13],
        ],
        radius: [0.02, 0.05, 0.05, 0.05, 0.02],
        yc: 0.67,
        frameKey: 'chrome',
        innerKey: 'grille',
        frame: 0.016,
      })
      frontPoly(body, add, 'lamp', [[0.33, 0.75], [0.79, 0.775], [0.82, 0.85], [0.33, 0.83]])
      frontPoly(body, add, 'lampGlass', [[0.42, 0.775], [0.52, 0.78], [0.52, 0.81], [0.42, 0.805]], { offset: 0.007 })
      frontStrip(body, add, 'drl', [[0.4, 0.8], [0.55, 0.82], [0.62, 0.79]], 0.012)
      frontStrip(body, add, 'drl', [[0.64, 0.8], [0.76, 0.835]], 0.01)
      frontPoly(body, add, 'mesh', [[-0.5, 0.31], [0.5, 0.31], [0.56, 0.47], [-0.56, 0.47]], { centre: true, nu: 40 })
      frontPoly(body, add, 'black', [[0.6, 0.3], [0.74, 0.34], [0.74, 0.6], [0.64, 0.56]], { nu: 12 })
    },
    rear(body, add) {
      rearPoly(body, add, 'tailGlass', [[0.38, 0.96], [0.84, 0.97], [0.84, 1.02], [0.4, 1.03]])
      rearStrip(body, add, 'tail', [[0.42, 0.995], [0.8, 1.0]], 0.012)
      rearPoly(body, add, 'black', [[-0.6, 0.36], [0.6, 0.36], [0.58, 0.46], [-0.58, 0.46]], { centre: true })
      exhausts(body, add, { tips: [-0.42, -0.32, 0.32, 0.42], y: 0.4, r: 0.04 })
    },
    details: (body, add) => commonDetails(body, add, { mirror: 'paint' }),
  },

  /* BMW X3 (G45) M Sport — light grey, angular kidneys, black wheels, red calipers. */
  x3: {
    ...suv({
      L: 4.755, W: 1.92, H: 1.66, wb: 2.865, fo: 0.86,
      R: 0.37, tireW: 0.255, rimR: 0.262, wheel: 'double',
      noseTop: 0.93, cowl: 1.04, belt: 1.05, beltRear: 1.08, tailTop: 1.04,
      wsBack: 0.72, wsRun: 0.95, rails: true, roof: 'sav', tailInset: 0.14,
    }),
    paint: { hex: '#cfccc6', metallic: true },
    rim: { color: '#121316' },
    caliper: '#c8102e',
    grilleTexture: 'diagonal',
    front(body, add) {
      kidneys(body, add, {
        outline: [
          [0.015, -0.14],
          [0.3, -0.14],
          [0.34, 0.03],
          [0.3, 0.14],
          [0.015, 0.14],
        ],
        radius: [0.02, 0.03, 0.04, 0.04, 0.02],
        yc: 0.7,
        frameKey: 'black',
        innerKey: 'grille',
        frame: 0.02,
      })
      frontPoly(body, add, 'lamp', [[0.37, 0.78], [0.84, 0.8], [0.85, 0.89], [0.36, 0.865]])
      frontPoly(body, add, 'lampGlass', [[0.44, 0.8], [0.6, 0.805], [0.6, 0.84], [0.44, 0.835]], { offset: 0.007 })
      frontStrip(body, add, 'drl', [[0.66, 0.815], [0.67, 0.865]], 0.012)
      frontStrip(body, add, 'drl', [[0.74, 0.82], [0.75, 0.87]], 0.012)
      frontStrip(body, add, 'drl', [[0.4, 0.852], [0.62, 0.86]], 0.008)
      frontPoly(body, add, 'trim', [[-0.64, 0.3], [0.64, 0.3], [0.7, 0.5], [-0.7, 0.5]], { centre: true, nu: 40 })
      frontPoly(body, add, 'mesh', [[-0.46, 0.34], [0.46, 0.34], [0.5, 0.48], [-0.5, 0.48]], { centre: true, nu: 40, offset: 0.008 })
      frontPoly(body, add, 'black', [[0.66, 0.36], [0.78, 0.4], [0.78, 0.66], [0.7, 0.62]], { nu: 12 })
    },
    rear(body, add) {
      rearPoly(body, add, 'tailGlass', [[0.4, 1.0], [0.9, 1.0], [0.9, 1.05], [0.42, 1.06]])
      rearStrip(body, add, 'tail', [[0.44, 1.03], [0.86, 1.03]], 0.012)
      rearPoly(body, add, 'trim', [[-0.66, 0.38], [0.66, 0.38], [0.64, 0.5], [-0.64, 0.5]], { centre: true })
    },
    details: (body, add) => commonDetails(body, add, { mirror: 'paint' }),
  },

  /* New BMW X5 (Neue Klasse design) — slim chrome kidneys in a black band with X lamps. */
  x5: {
    ...suv({
      L: 4.95, W: 2.0, H: 1.75, wb: 2.99, fo: 0.92,
      R: 0.385, tireW: 0.275, rimR: 0.275, wheel: 'aero',
      noseTop: 0.98, cowl: 1.1, belt: 1.11, beltRear: 1.13, tailTop: 1.08,
      wsBack: 0.72, wsRun: 1.0, roof: 'sav', tailInset: 0.14, crease: 0.04,
      roofPanel: { x0: -1.6, x1: 0.2, t: 0.44, material: 'black' },
    }),
    paint: { hex: '#8a8574', metallic: true },
    rim: { color: '#3b3e43', face: '#b9bdc2' },
    caliper: '#2a2c30',
    grilleTexture: 'barsV',
    front(body, add) {
      // Full-width black band holding lamps and kidneys.
      frontPoly(body, add, 'lamp', [[-0.86, 0.83], [0.86, 0.83], [0.86, 0.93], [-0.86, 0.95]], { centre: true, nu: 60, offset: 0.004 })
      kidneys(body, add, {
        outline: [
          [0.018, -0.16],
          [0.13, -0.16],
          [0.135, 0.14],
          [0.018, 0.14],
        ],
        radius: 0.035,
        yc: 0.87,
        frameKey: 'chrome',
        innerKey: 'grille',
        frame: 0.012,
        protrude: 0.025,
      })
      // "X" daytime lights at the outer ends.
      frontStrip(body, add, 'drl', [[0.6, 0.845], [0.72, 0.92]], 0.016)
      frontStrip(body, add, 'drl', [[0.6, 0.92], [0.72, 0.845]], 0.016)
      frontStrip(body, add, 'drl', [[0.76, 0.845], [0.85, 0.915]], 0.014)
      frontPoly(body, add, 'lampGlass', [[0.28, 0.86], [0.56, 0.86], [0.56, 0.9], [0.28, 0.9]], { offset: 0.007 })
      // Lower bumper.
      frontPoly(body, add, 'trim', [[-0.72, 0.3], [0.72, 0.3], [0.8, 0.62], [0.62, 0.7], [-0.62, 0.7], [-0.8, 0.62]], { centre: true, nu: 50 })
      frontPoly(body, add, 'mesh', [[-0.52, 0.36], [0.52, 0.36], [0.56, 0.56], [-0.56, 0.56]], { centre: true, nu: 40, offset: 0.008 })
      frontStrip(body, add, 'chrome', [[-0.56, 0.585], [0.56, 0.585]], 0.012, { centre: true, offset: 0.011 })
    },
    rear(body, add) {
      rearPoly(body, add, 'tailGlass', [[0.2, 1.0], [0.92, 1.0], [0.92, 1.06], [0.2, 1.06]])
      rearStrip(body, add, 'tail', [[0.26, 1.03], [0.88, 1.03]], 0.01)
      rearStrip(body, add, 'tail', [[0.78, 1.01], [0.88, 1.05]], 0.01)
      rearPoly(body, add, 'trim', [[-0.7, 0.4], [0.7, 0.4], [0.68, 0.52], [-0.68, 0.52]], { centre: true })
    },
    details: (body, add) => commonDetails(body, add, { mirror: 'black', handle: 'black' }),
  },

  /* BMW X6 (G06 LCI) — coupé SAC, wide glowing kidneys. */
  x6: {
    ...suv({
      L: 4.935, W: 2.004, H: 1.696, wb: 2.975, fo: 0.92,
      R: 0.38, tireW: 0.275, rimR: 0.27, wheel: 'star',
      noseTop: 0.98, cowl: 1.08, belt: 1.09, beltRear: 1.12, tailTop: 1.09,
      wsBack: 0.72, wsRun: 1.0, roof: 'coupe', deck: 0.3,
      sideRear: [
        [0, -1.72], [0.2, -1.76], [0.45, -1.68], [1, -1.28],
      ],
      pillars: [[-0.06, 0.02]],
      roofPanel: { x0: -0.7, x1: 0.4, t: 0.5, material: 'glass' },
    }),
    paint: { hex: '#8b9096', metallic: true },
    rim: { color: '#1b1c1f', face: '#9da1a6' },
    caliper: '#1f55d8',
    grilleTexture: 'barsV',
    front(body, add) {
      kidneys(body, add, {
        outline: [
          [0.015, -0.15],
          [0.32, -0.15],
          [0.36, 0.02],
          [0.33, 0.15],
          [0.015, 0.15],
        ],
        radius: [0.02, 0.05, 0.05, 0.05, 0.02],
        yc: 0.74,
        frameKey: 'chrome',
        innerKey: 'grille',
        frame: 0.016,
      })
      frontPoly(body, add, 'lamp', [[0.4, 0.82], [0.88, 0.85], [0.89, 0.93], [0.38, 0.905]])
      frontPoly(body, add, 'lampGlass', [[0.48, 0.845], [0.62, 0.85], [0.62, 0.88], [0.48, 0.875]], { offset: 0.007 })
      frontStrip(body, add, 'drl', [[0.44, 0.86], [0.8, 0.88], [0.84, 0.86]], 0.012)
      frontPoly(body, add, 'mesh', [[-0.58, 0.32], [0.58, 0.32], [0.64, 0.52], [-0.64, 0.52]], { centre: true, nu: 40 })
      frontPoly(body, add, 'black', [[0.68, 0.34], [0.82, 0.38], [0.82, 0.66], [0.72, 0.62]], { nu: 12 })
    },
    rear(body, add) {
      rearPoly(body, add, 'tailGlass', [[0.32, 1.02], [0.92, 1.03], [0.92, 1.08], [0.34, 1.09]])
      rearStrip(body, add, 'tail', [[0.36, 1.05], [0.86, 1.055], [0.9, 1.035]], 0.014)
      rearPoly(body, add, 'black', [[-0.7, 0.4], [0.7, 0.4], [0.68, 0.52], [-0.68, 0.52]], { centre: true })
      exhausts(body, add, { tips: [-0.5, -0.4, 0.4, 0.5], y: 0.44, r: 0.045 })
    },
    details: (body, add) => commonDetails(body, add, { mirror: 'black' }),
  },

  /* BMW X7 (G07 LCI) — tall three-row SAV, huge chrome kidneys, split headlights. */
  x7: {
    ...suv({
      L: 5.181, W: 2.0, H: 1.835, wb: 3.105, fo: 0.95,
      R: 0.39, tireW: 0.285, rimR: 0.28, wheel: 'multi',
      noseTop: 1.06, cowl: 1.15, belt: 1.16, beltRear: 1.18, tailTop: 1.13,
      wsBack: 0.75, wsRun: 0.95, rails: true, roof: 'sav', tailInset: 0.12, crease: 0.04,
      pillars: [[0.02, 0.1], [-1.05, -0.98]],
      cPillar: -0.1,
      sideRear: [
        [0, -2.18], [0.14, -2.24], [0.32, -2.2], [1, -2.0],
      ],
    }),
    paint: { hex: '#1e2a4d', metallic: true },
    rim: { color: '#2b2e33', face: '#c5c9ce' },
    caliper: '#2a2c30',
    grilleTexture: 'barsV',
    front(body, add) {
      kidneys(body, add, {
        outline: [
          [0.015, -0.2],
          [0.3, -0.19],
          [0.33, 0.14],
          [0.3, 0.19],
          [0.015, 0.19],
        ],
        radius: [0.02, 0.05, 0.05, 0.05, 0.02],
        yc: 0.76,
        frameKey: 'chrome',
        innerKey: 'grille',
        frame: 0.02,
      })
      // Split lights: slim daytime lights on top, main lamps lower down.
      frontPoly(body, add, 'lamp', [[0.36, 0.92], [0.86, 0.95], [0.86, 0.975], [0.36, 0.955]])
      frontStrip(body, add, 'drl', [[0.38, 0.94], [0.84, 0.962]], 0.014)
      frontPoly(body, add, 'lamp', [[0.62, 0.56], [0.84, 0.58], [0.84, 0.7], [0.66, 0.68]])
      frontPoly(body, add, 'mesh', [[-0.5, 0.34], [0.5, 0.34], [0.56, 0.5], [-0.56, 0.5]], { centre: true, nu: 40 })
      frontStrip(body, add, 'chrome', [[-0.56, 0.52], [0.56, 0.52]], 0.012, { centre: true, offset: 0.011 })
    },
    rear(body, add) {
      rearPoly(body, add, 'tailGlass', [[0.34, 1.05], [0.92, 1.06], [0.92, 1.11], [0.36, 1.11]])
      rearStrip(body, add, 'tail', [[0.38, 1.08], [0.88, 1.085]], 0.012)
      rearStrip(body, add, 'chrome', [[-0.34, 1.08], [0.34, 1.08]], 0.014, { centre: true })
      rearPoly(body, add, 'black', [[-0.7, 0.42], [0.7, 0.42], [0.68, 0.54], [-0.68, 0.54]], { centre: true })
      exhausts(body, add, { tips: [-0.55, 0.55], y: 0.45, r: 0.05, shape: 'square' })
    },
    details: (body, add) => commonDetails(body, add, { mirror: 'paint' }),
  },

  /* BMW XM (G09) — Cape York Green, octagonal kidneys with bronze outline. */
  xm: {
    ...suv({
      L: 5.11, W: 2.005, H: 1.755, wb: 3.105, fo: 0.95,
      R: 0.4, tireW: 0.295, rimR: 0.29, wheel: 'star',
      noseTop: 1.04, cowl: 1.12, belt: 1.15, beltRear: 1.2, tailTop: 1.15,
      wsBack: 0.75, wsRun: 1.02, roof: 'sav', tailInset: 0.16, crease: 0.07,
      pillars: [[-0.02, 0.06]],
      sideRear: [
        [0, -1.64], [0.18, -1.7], [0.4, -1.62], [1, -1.3],
      ],
      roofPanel: { x0: -1.3, x1: 0.4, t: 0.42, material: 'black' },
    }),
    paint: { hex: '#3d4a40', metallic: true },
    rim: { color: '#16171a', face: '#a88a5a' },
    caliper: '#a88a5a',
    grilleTexture: 'barsV',
    front(body, add) {
      kidneys(body, add, {
        outline: [
          [0.015, -0.18],
          [0.24, -0.18],
          [0.33, -0.08],
          [0.33, 0.1],
          [0.25, 0.18],
          [0.015, 0.18],
        ],
        radius: 0.02,
        yc: 0.74,
        frameKey: 'bronze',
        innerKey: 'grille',
        frame: 0.02,
      })
      frontPoly(body, add, 'lamp', [[0.38, 0.92], [0.86, 0.95], [0.86, 0.975], [0.4, 0.955]])
      frontStrip(body, add, 'drl', [[0.4, 0.94], [0.84, 0.962]], 0.012)
      frontPoly(body, add, 'lamp', [[0.56, 0.5], [0.82, 0.52], [0.82, 0.64], [0.62, 0.62]])
      frontPoly(body, add, 'mesh', [[-0.48, 0.3], [0.48, 0.3], [0.52, 0.48], [-0.52, 0.48]], { centre: true, nu: 40 })
    },
    rear(body, add) {
      rearPoly(body, add, 'tailGlass', [[0.38, 1.08], [0.92, 1.09], [0.92, 1.15], [0.4, 1.15]])
      rearStrip(body, add, 'tail', [[0.42, 1.11], [0.6, 1.13], [0.88, 1.12]], 0.014)
      rearPoly(body, add, 'black', [[-0.72, 0.42], [0.72, 0.42], [0.7, 0.56], [-0.7, 0.56]], { centre: true })
      exhausts(body, add, { tips: [-0.56, -0.46, 0.46, 0.56], y: 0.47, r: 0.045, shape: 'square' })
    },
    details: (body, add) => commonDetails(body, add, { mirror: 'paint', handle: 'bronze' }),
  },

  /* BMW iX (I20 LCI) — matte grey, closed jumbo kidney, ultra-slim lamps. */
  ix: {
    ...suv({
      L: 4.953, W: 1.967, H: 1.695, wb: 3.0, fo: 0.95,
      R: 0.39, tireW: 0.275, rimR: 0.28, wheel: 'aero',
      noseTop: 0.95, cowl: 1.06, belt: 1.07, beltRear: 1.1, tailTop: 1.06,
      wsBack: 0.8, wsRun: 1.05, roof: 'sav', tailInset: 0.16, crease: 0.03, bendFront: 0.18,
      pillars: [[-0.04, 0.04]],
      sideRear: [
        [0, -1.82], [0.5, -1.84], [1, -1.66],
      ],
      roofPanel: { x0: -1.5, x1: 0.42, t: 0.45, material: 'black' },
    }),
    paint: { hex: '#8e9296', metallic: false, matte: true },
    rim: { color: '#2a2c30', face: '#d3d6da' },
    caliper: '#1f55d8',
    grilleTexture: 'gloss',
    front(body, add) {
      // One-piece closed grille shaped like two tall kidneys with a centre notch.
      kidneys(body, add, {
        outline: [
          [-0.3, -0.19],
          [0.3, -0.19],
          [0.31, 0.14],
          [0.25, 0.2],
          [0.04, 0.2],
          [0.0, 0.15],
          [-0.04, 0.2],
          [-0.25, 0.2],
          [-0.31, 0.14],
        ],
        radius: [0.06, 0.06, 0.05, 0.04, 0.03, 0.02, 0.03, 0.04, 0.05],
        yc: 0.66,
        frameKey: 'chrome',
        innerKey: 'grille',
        frame: 0.014,
        single: true,
        protrude: 0.015,
      })
      frontPoly(body, add, 'lamp', [[0.36, 0.835], [0.84, 0.86], [0.84, 0.89], [0.36, 0.865]])
      frontStrip(body, add, 'drl', [[0.38, 0.85], [0.82, 0.874]], 0.014)
      frontPoly(body, add, 'black', [[0.48, 0.3], [0.78, 0.34], [0.72, 0.56], [0.6, 0.5]], { nu: 16 })
      frontPoly(body, add, 'black', [[-0.38, 0.28], [0.38, 0.28], [0.4, 0.4], [-0.4, 0.4]], { centre: true, nu: 30 })
    },
    rear(body, add) {
      rearPoly(body, add, 'tailGlass', [[0.34, 1.0], [0.9, 1.0], [0.9, 1.04], [0.36, 1.04]])
      rearStrip(body, add, 'tail', [[0.38, 1.02], [0.86, 1.02]], 0.01)
      rearPoly(body, add, 'black', [[-0.7, 0.38], [0.7, 0.38], [0.68, 0.48], [-0.68, 0.48]], { centre: true })
    },
    details: (body, add) => commonDetails(body, add, { mirror: 'paint', handle: 'black' }),
  },
}
