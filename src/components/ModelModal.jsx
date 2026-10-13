import { lazy, Suspense, useEffect, useRef } from 'react'
import { formatPrice, PRICE_NOTE } from '../data/models.js'
import SceneBoundary from './SceneBoundary.jsx'

const ModelViewer = lazy(() => import('../three/ModelViewer.jsx'))

/**
 * Details dialog: description, trims with prices, specs and highlights.
 * `list` (optional) enables previous / next navigation between models.
 */
export default function ModelModal({ model, list = [], onClose, onNavigate }) {
  const closeRef = useRef(null)
  const dialogRef = useRef(null)
  const index = list.findIndex((m) => m.id === model.id)
  const prev = index > 0 ? list[index - 1] : null
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null

  useEffect(() => {
    closeRef.current?.focus()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [])

  useEffect(() => {
    dialogRef.current?.scrollTo?.({ top: 0 })
  }, [model])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && next) onNavigate(next)
      if (e.key === 'ArrowLeft' && prev) onNavigate(prev)
      if (e.key === 'Tab') {
        // Keep keyboard focus inside the dialog.
        const focusable = dialogRef.current.querySelectorAll('button, a[href], select, [tabindex]:not([tabindex="-1"])')
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onNavigate, next, prev])

  const minPrice = Math.min(...model.trims.map((t) => t.price))
  const maxPrice = Math.max(...model.trims.map((t) => t.price))

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={dialogRef}
        style={{ '--accent': model.look.paint }}
      >
        <button className="modal__close" onClick={onClose} ref={closeRef} aria-label="Close details">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="modal__hero">
          <div>
            <p className="eyebrow">{model.series}</p>
            <h2 id="modal-title">{model.name}</h2>
            <p className="modal__tagline">{model.tagline}</p>
          </div>
          <div className="modal__car" aria-label={`${model.name} 3D view`}>
            <SceneBoundary>
              <Suspense fallback={<span className="spinner modal__spinner" aria-hidden="true" />}>
                <ModelViewer key={model.id} modelId={model.id} />
              </Suspense>
            </SceneBoundary>
          </div>
          <p className="modal__paint">Shown in {model.look.paintName}</p>
        </div>

        <div className="modal__content">
          <div className="modal__intro">
            <p>{model.description}</p>
            <div className="price-box">
              <span>Starting at</span>
              <strong>{formatPrice(minPrice)}*</strong>
              {maxPrice > minPrice && <small>up to {formatPrice(maxPrice)} for the top trim</small>}
            </div>
          </div>

          <h3 className="modal__heading">Trims &amp; prices</h3>
          <div className="table-wrap">
            <table className="trims">
              <thead>
                <tr>
                  <th scope="col">Trim</th>
                  <th scope="col">Drive</th>
                  <th scope="col">Power</th>
                  <th scope="col">0–60 mph</th>
                  <th scope="col" className="num">MSRP*</th>
                </tr>
              </thead>
              <tbody>
                {model.trims.map((t) => (
                  <tr key={t.name}>
                    <th scope="row">{t.name}</th>
                    <td>{t.drive}</td>
                    <td>{t.power}</td>
                    <td>{t.accel}</td>
                    <td className="num">{formatPrice(t.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal__cols">
            <div>
              <h3 className="modal__heading">Key specs</h3>
              <dl className="specs">
                {model.specs.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="modal__heading">Highlights</h3>
              <ul className="highlights">
                {model.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="modal__note">* {PRICE_NOTE}</p>
        </div>

        {(prev || next) && (
          <div className="modal__nav">
            <button className="btn btn--ghost" disabled={!prev} onClick={() => prev && onNavigate(prev)}>
              ← {prev ? prev.name : 'Previous'}
            </button>
            <button className="btn btn--ghost" disabled={!next} onClick={() => next && onNavigate(next)}>
              {next ? next.name : 'Next'} →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
