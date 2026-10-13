import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` keeps asset paths relative so the built site works from any
// sub-folder (GitHub Pages, Netlify, a plain static server, ...).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // React in its own chunk; three.js + react-three in another one that is
        // only downloaded together with the 3D scenes.
        manualChunks(id) {
          if (id.includes('preload-helper')) return 'react'
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
          return 'three'
        },
      },
    },
  },
})
