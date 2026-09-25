import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Swaps index.html's `<!--@chat/tokens/head-->` for the shared fonts and
// pre-paint theme script. Read per request, so an edit shows on reload. Fails
// the build rather than shipping a page with no fonts and a theme flash. The
// snippet's own comments are for its readers, so they are dropped on the way.
// Same plugin as apps/chat/vite.config.ts.
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
export default defineConfig(({ command, mode }) => {
  // "Back to Demos" goes to the chat app. Without its URL the link would go
  // nowhere, so a build stops here instead of shipping that.
  if (command === 'build' && !loadEnv(mode, import.meta.dirname, 'VITE_').VITE_CHAT_URL) {
    throw new Error('Set VITE_CHAT_URL to the chat app’s URL — the link home needs it.')
  }
  return {
    plugins: [react(), tailwindcss(), tokensHead()],
    // Pinned so it never collides with the chat app on 5173 — .env.development
    // in each app points at the other by port.
    server: { port: 5174, strictPort: true },
    preview: { port: 4174, strictPort: true },
  }
})
