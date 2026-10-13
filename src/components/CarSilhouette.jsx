import { useId } from 'react'

/** Mixes a hex colour with white (amt > 0) or black (amt < 0). */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c) => Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Generates a stylised side-view illustration for a model from a few
 * proportions (`look` in data/models.js). The nose points right.
 */
function buildPaths(look) {
  const { style = 'sav', length = 1, belt: beltH = 92, roof: roofH = 136, wheel = 1, windows = 2, boxy = false } = look
  const G = 176
  const L = 410 * length
  const x0 = 240 - L / 2
  const x1 = 240 + L / 2
  const R = 30 * wheel
  const cy = G - R
  const Ra = R + 5
  const wr = x0 + L * 0.19
  const wf = x1 - L * 0.185
  const rock = cy + 6
  const ax = Math.sqrt(Ra * Ra - 36)
  const belt = G - beltH
  const roofY = G - roofH

  const hood = style === 'coupe' ? 0.33 : 0.27
  const hoodEnd = x1 - L * hood
  const wsTop = x1 - L * (hood + (style === 'coupe' ? 0.2 : 0.17))
  const roofEnd = x0 + L * (boxy ? 0.05 : 0.09)

  let roofPath
  let dloRear
  if (style === 'sav') {
    roofPath = `L ${roofEnd + 16} ${roofY + 2} Q ${roofEnd} ${roofY + 3} ${roofEnd - 3} ${roofY + 16} L ${x0 + 2} ${belt - 4}`
    dloRear = `L ${roofEnd + 22} ${roofY + 10} L ${roofEnd + 12} ${belt - 10}`
  } else if (style === 'sac') {
    roofPath = `Q ${x0 + L * 0.3} ${roofY + 1} ${x0 + L * 0.1} ${belt - 14} L ${x0 + 3} ${belt - 9}`
    dloRear = `Q ${x0 + L * 0.34} ${roofY + 9} ${x0 + L * 0.2} ${belt - 10}`
  } else {
    roofPath = `Q ${x0 + L * 0.34} ${roofY + 2} ${x0 + L * 0.15} ${belt - 9} L ${x0 + 4} ${belt - 11}`
    dloRear = `Q ${x0 + L * 0.37} ${roofY + 10} ${x0 + L * 0.25} ${belt - 8}`
  }

  const body = [
    `M ${x0 + 14} ${rock}`,
    `L ${wr - ax} ${rock}`,
    `A ${Ra} ${Ra} 0 1 1 ${wr + ax} ${rock}`,
    `L ${wf - ax} ${rock}`,
    `A ${Ra} ${Ra} 0 1 1 ${wf + ax} ${rock}`,
    `L ${x1 - 12} ${rock}`,
    `Q ${x1 + 2} ${rock} ${x1 + 2} ${rock - 16}`,
    `L ${x1 + 4} ${belt + 18}`,
    `Q ${x1 + 4} ${belt + 2} ${x1 - 18} ${belt}`,
    `L ${hoodEnd} ${belt - 6}`,
    `L ${wsTop} ${roofY + 4}`,
    `Q ${wsTop - 10} ${roofY} ${wsTop - 30} ${roofY}`,
    roofPath,
    `L ${x0} ${belt + 10}`,
    `L ${x0 - 2} ${rock - 14}`,
    `Q ${x0} ${rock} ${x0 + 14} ${rock}`,
    'Z',
  ].join(' ')

  const dlo = [
    `M ${hoodEnd - 12} ${belt - 10}`,
    `L ${wsTop - 12} ${roofY + 9}`,
    `L ${wsTop - 30} ${roofY + 9}`,
    dloRear,
    'Z',
  ].join(' ')

  const pillarStart = wsTop - 30
  const pillarEnd = style === 'sav' ? roofEnd + 22 : x0 + L * 0.3
  const pillars = [0.5, ...(windows === 3 ? [0.8] : [])].map((t) => pillarStart + (pillarEnd - pillarStart) * t)

  return { G, L, x0, x1, R, cy, wr, wf, rock, belt, roofY, body, dlo, pillars, ax }
}

export default function CarSilhouette({ look, className, title }) {
  const id = useId().replace(/:/g, '')
  const p = buildPaths(look)
  const paint = look.paint
  const wheels = [p.wr, p.wf]

  return (
    <svg className={className} viewBox="0 0 480 200" role="img" aria-label={title}>
      <defs>
        <linearGradient id={`body${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(paint, 0.35)} />
          <stop offset="0.38" stopColor={paint} />
          <stop offset="0.62" stopColor={shade(paint, -0.25)} />
          <stop offset="1" stopColor={shade(paint, -0.6)} />
        </linearGradient>
        <linearGradient id={`glass${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a4452" />
          <stop offset="0.45" stopColor="#0d1015" />
          <stop offset="1" stopColor="#1b2028" />
        </linearGradient>
        <radialGradient id={`rim${id}`}>
          <stop offset="0" stopColor="#5d636b" />
          <stop offset="0.7" stopColor="#2b2f35" />
          <stop offset="1" stopColor="#16181b" />
        </radialGradient>
        <filter id={`blur${id}`} x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <ellipse cx="240" cy={p.G + 2} rx={p.L * 0.5} ry="7" fill="#000" opacity="0.6" filter={`url(#blur${id})`} />

      <path d={p.body} fill={`url(#body${id})`} />
      <path d={p.dlo} fill={`url(#glass${id})`} stroke={shade(paint, -0.7)} strokeWidth="1.5" />
      {p.pillars.map((x) => (
        <line key={x} x1={x} y1={p.roofY + 6} x2={x - 4} y2={p.belt - 8} stroke="#0b0c0f" strokeWidth="5" />
      ))}

      {/* shoulder highlight */}
      <path
        d={`M ${p.x1 - 20} ${p.belt + 4} L ${p.x0 + 10} ${p.belt + 2}`}
        stroke="#fff"
        strokeOpacity="0.28"
        strokeWidth="1.4"
      />
      {/* side skirt */}
      <path d={`M ${p.wr + p.ax + 4} ${p.rock - 3} L ${p.wf - p.ax - 4} ${p.rock - 3}`} stroke="#0a0b0d" strokeWidth="6" />
      {look.ev && (
        <path d={`M ${p.wr + p.ax + 8} ${p.rock - 7} L ${p.wf - p.ax - 8} ${p.rock - 7}`} stroke="#3d8bff" strokeWidth="2" />
      )}

      {/* lights */}
      <path
        d={`M ${p.x1 + 1} ${p.belt + 7} L ${p.x1 - 22} ${p.belt + 4} L ${p.x1 - 20} ${p.belt + 9} L ${p.x1 + 2} ${p.belt + 12} Z`}
        fill="#eaf5ff"
      />
      <path
        d={`M ${p.x0 + 1} ${p.belt + 3} L ${p.x0 + 24} ${p.belt + 1} L ${p.x0 + 23} ${p.belt + 7} L ${p.x0} ${p.belt + 9} Z`}
        fill="#ff2a2a"
      />

      {wheels.map((x) => (
        <g key={x} transform={`translate(${x} ${p.cy})`}>
          <circle r={p.R} fill="#0d0e10" />
          <circle r={p.R * 0.68} fill={`url(#rim${id})`} />
          {[0, 72, 144, 216, 288].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <path d={`M -2 ${-p.R * 0.12} L -4 ${-p.R * 0.62} M 2 ${-p.R * 0.12} L 4 ${-p.R * 0.62}`} stroke="#121316" strokeWidth="2.6" />
            </g>
          ))}
          <circle r={p.R * 0.14} fill="#2b2f35" stroke="#0e0f12" />
        </g>
      ))}
    </svg>
  )
}
