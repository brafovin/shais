import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import { M4, formatPrice } from '../data/models.js'
import { PAINTS } from '../data/paints.js'

// three.js is only downloaded once the hero mounts, keeping the first paint fast.
const M4Scene = lazy(() => import('../three/M4Scene.jsx'))

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) {
      return <div className="hero__fallback">3D preview unavailable on this device — WebGL is required.</div>
    }
    return this.props.children
  }
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export default function Hero({ onShowDetails }) {
  const [paint, setPaint] = useState(PAINTS[0])
  const [visible, setVisible] = useState(true)
  const [spin, setSpin] = useState(true)
  const reducedMotion = usePrefersReducedMotion()
  const sectionRef = useRef(null)

  // Pause rendering while the hero is scrolled out of view.
  useEffect(() => {
    const el = sectionRef.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.02 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section className="hero" id="top" ref={sectionRef}>
      <div className="hero__canvas">
        <SceneBoundary>
          <Suspense
            fallback={
              <div className="hero__loading">
                <span className="spinner" aria-hidden="true" />
                Preparing the showroom…
              </div>
            }
          >
            <M4Scene paint={paint} active={visible} autoRotate={spin && !reducedMotion} />
          </Suspense>
        </SceneBoundary>
      </div>

      <div className="hero__watermark" aria-hidden="true">
        M4
      </div>

      <div className="hero__overlay">
        <div className="hero__copy">
          <p className="eyebrow">
            <span className="m-stripes" aria-hidden="true" /> BMW M · {M4.series}
          </p>
          <h1 className="hero__title">
            M4 <span>Competition</span>
          </h1>
          <p className="hero__lead">{M4.tagline}</p>
          <p className="hero__price">
            From <strong>{formatPrice(M4.startingPrice)}</strong>
            <sup>*</sup>
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary" onClick={() => onShowDetails(M4)}>
              Details &amp; prices
            </button>
            <a className="btn btn--ghost" href="#models">
              Explore X models
            </a>
          </div>
        </div>

        <dl className="hero__stats">
          {M4.stats.map((s) => (
            <div key={s.label} className="stat">
              <dt>{s.label}</dt>
              <dd>
                {s.value}
                <span>{s.unit}</span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="hero__config">
          <div className="paint">
            <p className="paint__label">
              <span>Paint</span> {paint.name}
            </p>
            <div className="paint__swatches" role="radiogroup" aria-label="Paint colour">
              {PAINTS.map((p) => (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={p.id === paint.id}
                  aria-label={p.name}
                  title={p.name}
                  className={`swatch ${p.id === paint.id ? 'swatch--active' : ''}`}
                  style={{ '--swatch': p.hex }}
                  onClick={() => setPaint(p)}
                />
              ))}
            </div>
          </div>
          <button className="spin-toggle" onClick={() => setSpin((s) => !s)} aria-pressed={spin}>
            {spin ? 'Pause rotation' : 'Auto-rotate'}
          </button>
        </div>

        <p className="hero__hint" aria-hidden="true">
          <span className="hint-icon" /> Drag to explore 360°
        </p>
      </div>
    </section>
  )
}
