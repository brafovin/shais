import { useMemo, useState } from 'react'
import { FILTERS, X_MODELS, formatPrice } from '../data/models.js'
import CarSilhouette from './CarSilhouette.jsx'

const SORTS = {
  'price-asc': { label: 'Price: low to high', fn: (a, b) => a.startingPrice - b.startingPrice },
  'price-desc': { label: 'Price: high to low', fn: (a, b) => b.startingPrice - a.startingPrice },
}

function ModelCard({ model, onOpen }) {
  return (
    <article className="card" style={{ '--accent': model.look.paint }}>
      <div className="card__media">
        <span className="card__series">{model.series}</span>
        <CarSilhouette look={model.look} className="card__car" title={`${model.name} illustration`} />
      </div>
      <div className="card__body">
        <h3 className="card__name">{model.name}</h3>
        <p className="card__tagline">{model.tagline}</p>
        <div className="card__meta">
          <div>
            <span className="card__label">Starting at</span>
            <span className="card__price">{formatPrice(model.startingPrice)}*</span>
          </div>
          <div>
            <span className="card__label">Up to</span>
            <span className="card__power">{model.trims.at(-1).power}</span>
          </div>
        </div>
        <button className="btn btn--outline card__cta" onClick={(e) => onOpen(model, e.currentTarget)}>
          View details &amp; prices
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </article>
  )
}

export default function ModelsSection({ onOpen }) {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('price-asc')

  const models = useMemo(
    () => X_MODELS.filter((m) => filter === 'all' || m.categories.includes(filter)).sort(SORTS[sort].fn),
    [filter, sort],
  )

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
          From the city-sized X1 to the 738-hp XM Label — every BMW SUV pairs everyday versatility with the driving
          dynamics BMW is famous for. Pick a model to see its trims and prices.
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

      <div className="grid">
        {models.map((m) => (
          <ModelCard key={m.id} model={m} onOpen={(model, el) => onOpen(model, el, models)} />
        ))}
      </div>
    </section>
  )
}
