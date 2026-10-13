import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { FILTERS, X_MODELS, formatPrice } from '../data/models.js'
import SceneBoundary from './SceneBoundary.jsx'
import { usePrefersReducedMotion } from './Hero.jsx'

// The 3D showroom (three.js) only downloads when the section is rendered.
const XScene = lazy(() => import('../three/XScene.jsx'))

const SORTS = {
  'price-asc': { label: 'Price: low to high', fn: (a, b) => a.startingPrice - b.startingPrice },
  'price-desc': { label: 'Price: high to low', fn: (a, b) => b.startingPrice - a.startingPrice },
}

/** Extra paints offered for every X model (the factory colour is always first). */
const X_PAINTS = [
  { id: 'alpine', name: 'Alpine White', hex: '#eceeed', metallic: false },
  { id: 'sapphire', name: 'Black Sapphire', hex: '#0c0e12', metallic: true },
  { id: 'brooklyn', name: 'Brooklyn Grey', hex: '#8b9096', metallic: true },
  { id: 'portimao', name: 'Portimao Blue', hex: '#1b4fb0', metallic: true },
  { id: 'fire-red', name: 'Fire Red', hex: '#9c1018', metallic: true },
]

const SHORT_SERIES = {
  'Sports Activity Vehicle': 'SAV',
  'Sports Activity Coupe': 'Coupe SUV',
  'M High-Performance SAV': 'M SAV',
  'Electric Sports Activity Vehicle': 'Electric SAV',
}

const quickest = (m) => Math.min(...m.trims.map((t) => parseFloat(t.accel)))
const strongest = (m) => m.trims.at(-1).power

function useInView(ref) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return setInView(true)
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return inView
}

export default function ModelsSection({ onOpen }) {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('price-asc')
  const [selectedId, setSelectedId] = useState('x5')
  const [stageId, setStageId] = useState('x5')
  const [building, setBuilding] = useState(false)
  const [paintId, setPaintId] = useState('factory')
  const [spin, setSpin] = useState(true)
  const [everVisible, setEverVisible] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const stageRef = useRef(null)
  const inView = useInView(stageRef)

  useEffect(() => {
    if (inView) setEverVisible(true)
  }, [inView])

  const models = useMemo(
    () => X_MODELS.filter((m) => filter === 'all' || m.categories.includes(filter)).sort(SORTS[sort].fn),
    [filter, sort],
  )

  // Keep a visible model selected when the filter changes.
  useEffect(() => {
    if (models.length && !models.some((m) => m.id === selectedId)) setSelectedId(models[0].id)
  }, [models, selectedId])

  // Building a car takes a moment: highlight the tab first, then swap the 3D model.
  useEffect(() => {
    if (selectedId === stageId) return
    setBuilding(true)
    setPaintId('factory')
    const t = setTimeout(() => setStageId(selectedId), 40)
    return () => clearTimeout(t)
  }, [selectedId, stageId])
  useEffect(() => setBuilding(false), [stageId])

  const selected = X_MODELS.find((m) => m.id === selectedId)
  const index = models.findIndex((m) => m.id === selectedId)
  const next = models[(index + 1) % models.length]
  const paints = [{ id: 'factory', name: selected.look.paintName, hex: selected.look.paint }, ...X_PAINTS]
  const paint = paints.find((p) => p.id === paintId) ?? paints[0]

  return (
    <section className="models" id="models">
      <div className="section-head">
        <p className="eyebrow">
          <span className="m-stripes" aria-hidden="true" /> Sports Activity Vehicles
        </p>
        <h2>
          The BMW <em>X</em> family
        </h2>
        <p className="section-head__lead">
          From the city-sized X1 to the 738-hp XM Label. Pick a model, spin it in 3D and open its trims and prices.
        </p>
      </div>

      <div className="toolbar">
        <div className="chips" role="tablist" aria-label="Filter models">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              className={`chip ${filter === f.id ? 'chip--active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="sort">
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(SORTS).map(([id, s]) => (
              <option key={id} value={id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="xshow" style={{ '--accent': selected.look.paint }}>
        <div className="xshow__stage" ref={stageRef}>
          {everVisible && (
            <SceneBoundary>
              <Suspense
                fallback={
                  <div className="xshow__loading">
                    <span className="spinner" aria-hidden="true" />
                    Opening the showroom…
                  </div>
                }
              >
                <XScene
                  modelId={stageId}
                  paint={paintId === 'factory' ? null : paint}
                  active={inView}
                  autoRotate={spin && !reducedMotion}
                />
              </Suspense>
            </SceneBoundary>
          )}
          {building && (
            <div className="xshow__building" role="status">
              <span className="spinner" aria-hidden="true" /> Preparing {selected.name}…
            </div>
          )}

          <div className="xshow__info" key={selected.id}>
            <p className="xshow__series">{selected.series}</p>
            <h3 className="xshow__name">{selected.name}</h3>
            <p className="xshow__tagline">{selected.tagline}</p>
          </div>

          <div className="xshow__facts">
            <dl className="xshow__stats">
              <div>
                <dt>From</dt>
                <dd>{formatPrice(selected.startingPrice)}*</dd>
              </div>
              <div>
                <dt>Up to</dt>
                <dd>{strongest(selected)}</dd>
              </div>
              <div>
                <dt>0–60 mph</dt>
                <dd>{quickest(selected)} s</dd>
              </div>
            </dl>
            <div className="xshow__actions">
              <button className="btn btn--primary" onClick={(e) => onOpen(selected, e.currentTarget, models)}>
                Details &amp; prices
              </button>
              {models.length > 1 && (
                <button className="btn btn--ghost" onClick={() => setSelectedId(next.id)}>
                  Next: {next.name.replace('BMW ', '')} →
                </button>
              )}
            </div>
          </div>

          <div className="xshow__paint paint">
            <p className="paint__label">
              <span>Paint</span> {paint.name}
            </p>
            <div className="paint__swatches" role="radiogroup" aria-label="Paint colour">
              {paints.map((p) => (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={p.id === paint.id}
                  aria-label={p.name}
                  title={p.name}
                  className={`swatch ${p.id === paint.id ? 'swatch--active' : ''}`}
                  style={{ '--swatch': p.hex }}
                  onClick={() => setPaintId(p.id)}
                />
              ))}
            </div>
            <button className="spin-toggle" onClick={() => setSpin((s) => !s)} aria-pressed={spin}>
              {spin ? 'Pause rotation' : 'Auto-rotate'}
            </button>
          </div>
        </div>

        <div className="xshow__tabs" role="tablist" aria-label="Choose a model">
          {models.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={m.id === selectedId}
              className={`xtab ${m.id === selectedId ? 'xtab--active' : ''}`}
              onClick={() => setSelectedId(m.id)}
              style={{ '--tab-accent': m.look.paint }}
            >
              <span className="xtab__name">{m.name.replace('BMW ', '')}</span>
              <span className="xtab__type">{SHORT_SERIES[m.series] ?? m.series}</span>
              <span className="xtab__price">from {formatPrice(m.startingPrice)}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
