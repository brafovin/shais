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

The header car is a realistic 3D model of the **2021 BMW M4 Competition** by
Ricy (@ngon_3d), licensed **CC BY-NC 4.0**. That licence allows non-commercial
use only, with credit to the author; see
`src/assets/models/ATTRIBUTION.md`. In the browser the site:

- paints the car São Paulo Yellow, with dark bronze wheels and blue calipers;
- adds a carbon swan-neck wing, front splitter and canards, modelled after
  the reference photos.

If the model can't load, the site falls back to a procedurally generated M4
(`src/three/carShape.js`).

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
    RealM4.jsx               realistic GLB car, recolouring, fallback
    aero.js                  wing, splitter and canards
  data/
    models.js                M4 + X models: descriptions, trims, prices
    paints.js                M4 paint colours
  config.js                  3D model settings + credit
  assets/models/             optimised M4 model + attribution
```

## Editing models and prices

All content lives in `src/data/models.js`: names, descriptions, trims, prices,
specs and highlights. The `look` object on each model sets the proportions and
paint colour of its illustration.

Prices are **indicative US starting MSRPs (model year 2026, excluding
destination)** and change often. Check them against
[bmwusa.com](https://www.bmwusa.com) before publishing.

## Swapping the 3D model

To use a different car model, replace `src/assets/models/m4-competition.glb`
and adjust `src/config.js`:

- `rotationY`: set it so the car's nose points towards +X.
- `length`: the model is scaled to this length in metres.
- `materials`: the names of the paint, rim and caliper materials that the
  site recolours.

## Notes

- three.js loads lazily, so text and buttons render before the 3D scene. The
  scene stops rendering when the header is scrolled out of view.
- Auto-rotation is off when the visitor has “reduce motion” turned on.
- This is an unofficial fan project and is not affiliated with BMW AG. BMW,
  M4, X1–X7, XM and iX are trademarks of BMW AG.
