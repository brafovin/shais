import m4ModelUrl from './assets/models/m4-competition.glb?url'

/**
 * Realistic M4 Competition shown in the header (see assets/models/ATTRIBUTION.md).
 * If it fails to load, the built-in procedural car is shown instead.
 *
 * - `rotationY` turns the model so its nose points towards +X.
 * - `length` is the real-world length in metres the model is scaled to.
 * - `materials` lists the material names of the parts the configurator recolours.
 */
export const M4_MODEL = {
  url: m4ModelUrl,
  rotationY: Math.PI / 2,
  length: 4.79,
  materials: {
    paint: ['Material_692'],
    rims: ['Material_753'],
    calipers: ['Material_773'],
  },
}

export const M4_MODEL_CREDIT = {
  title: '2021 BMW M4 Competition',
  author: 'Ricy (@ngon_3d)',
  url: 'https://sketchfab.com/3d-models/2021-bmw-m4-competition-d3f07b471d9f4a2c9a2acf79d88a3645',
  license: 'CC BY-NC 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-nc/4.0/',
}
