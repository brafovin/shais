import { PRICE_NOTE } from '../data/models.js'

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="m-stripes" aria-hidden="true" />
          <div>
            <strong>BMW M Showroom</strong>
            <p>Interactive 3D concept built with React &amp; three.js.</p>
          </div>
        </div>
        <div className="footer__cols">
          <div>
            <h4>Models</h4>
            <a href="#top">M4 Competition</a>
            <a href="#models">X family</a>
          </div>
          <div>
            <h4>Contact</h4>
            <a href="mailto:hello@example.com">hello@example.com</a>
            <span>Mon – Sat · 9:00 – 19:00</span>
          </div>
        </div>
      </div>
      <p className="footer__legal">
        * {PRICE_NOTE} Top speed of 180 mph requires the optional M Driver’s Package. This is an unofficial fan
        project and is not affiliated with or endorsed by BMW AG. BMW, M4, X1–X7, XM and iX are trademarks of
        BMW AG.
      </p>
    </footer>
  )
}
