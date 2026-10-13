/**
 * Optional: drop a licensed glTF/GLB model of the M4 into `public/models/m4.glb`
 * and it will replace the built-in procedural car automatically.
 *
 * - `rotationY` turns the model so its nose points towards +X (the procedural
 *   car's orientation). Most downloaded models face +Z, hence -90°.
 * - `length` is the real-world length in metres the model is scaled to.
 * - Materials whose name matches `paintMaterial` get recoloured by the paint picker.
 */
export const M4_MODEL = {
  url: `${import.meta.env.BASE_URL}models/m4.glb`,
  rotationY: -Math.PI / 2,
  length: 4.79,
  paintMaterial: /paint|body|carpaint|exterior/i,
}
