# BMW M Showroom — 3D M4 Competition

An interactive BMW website built with **React**, **three.js** and
**react-three-fiber**.

- **Header / hero:** a real-time 3D **BMW M4 Competition** in a studio scene
  with a reflective floor. You can drag to orbit 360°, auto-rotate it, and
  switch between seven M4 paint colours (São Paulo Yellow, Isle of Man Green,
  Portimao Blue, …).
- **X family section:** cards for the BMW SUVs (X1, X2, X3, X5, X6, X7, XM and
  iX). You can filter them by body type, electrified or M Performance and sort
  them by price.
- **Details & prices:** every card has a button that opens a dialog with the
  description, a table of trims and prices, key specs and highlights. Prev/next
  buttons move between models. The M4 in the header has its own
  “Details & prices” button.

The M4 is generated **procedurally in code** (`src/three/carShape.js`), so the
project needs no downloaded 3D assets. Its parts include:

- a lofted body with flared wheel arches and a carbon roof;
- the kidney grille, LED headlights and L-shaped tail lights;
- quad exhausts, Y-spoke wheels and blue brake calipers.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the production build
```

Requires Node 18+.

## Project structure

```
src/
  App.jsx                    page layout + details dialog state
  components/
    Navbar.jsx               fixed nav with mobile menu
    Hero.jsx                 3D header, M4 stats, paint picker
    ModelsSection.jsx        X family grid, filters, sorting
    ModelModal.jsx           description / trims & prices dialog
    CarSilhouette.jsx        generated SVG side views for the cards
    Footer.jsx
  three/
    M4Scene.jsx              Canvas, studio lighting, floor, controls
    ProceduralM4.jsx         assembles the procedural M4
    carShape.js              body/cabin geometry generator
    Wheel.jsx                tyres, Y-spoke rims, brakes
    materials.js             paint, glass, carbon fibre, lights …
    ExternalCar.jsx          optional GLB loader
  data/
    models.js                M4 + X models: descriptions, trims, prices
    paints.js                M4 paint colours
  config.js                  settings for an optional GLB model
```

## Editing models and prices

All content lives in `src/data/models.js`: names, descriptions, trims, prices,
specs and highlights. The `look` object on each model sets the proportions and
paint colour of its illustration.

Prices are **indicative US starting MSRPs (model year 2026, excluding
destination)** and change often. Check them against
[bmwusa.com](https://www.bmwusa.com) before publishing.

## Using a real M4 3D model (optional)

If you have a **licensed** glTF model of the M4 (G82), save it as
`public/models/m4.glb`. It replaces the procedural car automatically. You can
adjust it in `src/config.js`:

- `rotationY`: set it so the car's nose points towards +X.
- `length`: the model is scaled to this length in metres.
- `paintMaterial`: a regex for the material names that the paint picker
  should recolour.

## Notes

- three.js loads lazily, so text and buttons render before the 3D scene. The
  scene stops rendering when the header is scrolled out of view.
- Auto-rotation is off when the visitor has “reduce motion” turned on.
- This is an unofficial fan project and is not affiliated with BMW AG. BMW,
  M4, X1–X7, XM and iX are trademarks of BMW AG.
