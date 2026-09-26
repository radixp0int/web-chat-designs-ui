import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Swaps index.html's `<!--@chat/tokens/head-->` for the shared fonts and
// pre-paint theme script. Read per request, so an edit shows on reload. Fails
// the build rather than shipping a page with no fonts and a theme flash. The
// snippet's own comments are for its readers, so they are dropped on the way.
function tokensHead(): Plugin {
  const marker = '<!--@chat/tokens/head-->'
  const file = createRequire(import.meta.url).resolve('@chat/tokens/head.html')
  return {
    name: 'chat-tokens-head',
    transformIndexHtml(html) {
      if (!html.includes(marker)) throw new Error(`index.html is missing ${marker}`)
      const head = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->\s*/g, '')
      return html.replace(marker, head)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), tokensHead()],
})
