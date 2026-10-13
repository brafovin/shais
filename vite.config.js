import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` keeps asset paths relative so the built site works from any
// sub-folder (GitHub Pages, Netlify, a plain static server, ...).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
  },
})
