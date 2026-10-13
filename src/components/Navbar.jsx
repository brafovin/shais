import { useEffect, useState } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = () => setOpen(false)

  return (
    <header className={`nav ${scrolled ? 'nav--solid' : ''} ${open ? 'nav--open' : ''}`}>
      <a href="#top" className="nav__brand" onClick={close}>
        <span className="m-stripes" aria-hidden="true" />
        <span className="nav__wordmark">BMW</span>
        <span className="nav__sub">M Showroom</span>
      </a>
      <button
        className="nav__toggle"
        aria-expanded={open}
        aria-controls="nav-links"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
      >
        <span />
        <span />
      </button>
      <nav id="nav-links" className="nav__links">
        <a href="#top" onClick={close}>M4 Competition</a>
        <a href="#models" onClick={close}>X Models</a>
        <a href="#contact" onClick={close}>Contact</a>
        <a href="#models" className="btn btn--small btn--primary" onClick={close}>
          Find your BMW
        </a>
      </nav>
    </header>
  )
}
