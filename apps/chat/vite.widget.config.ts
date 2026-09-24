import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Builds the embeddable chat widget as a single self-contained IIFE
// (dist-widget/aristotle-widget.js) that exposes window.AristotleChat.
// React and all CSS are bundled in; the host page only needs one script tag.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  publicDir: 'widget-public',
  build: {
    outDir: 'dist-widget',
    lib: {
      entry: resolve(import.meta.dirname, 'src/demo/widget/aristotleWidget.tsx'),
      name: 'AristotleChat',
      formats: ['iife'],
      fileName: () => 'aristotle-widget.js',
    },
  },
})
