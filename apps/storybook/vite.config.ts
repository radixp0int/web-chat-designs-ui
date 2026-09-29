import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Picked up by Storybook's Vite builder. The same two plugins every app in the
// repo compiles its sources with; the packages are source-only, so this is
// what turns their TSX and Tailwind classes into something a browser runs.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // Pre-bundled up front. Otherwise Vite discovers each of these the first
    // time a story that imports it is opened, re-optimises, and reloads the
    // whole preview mid-browse. Pre-bundling is server-side only: each story
    // still fetches these lazily, and only when it imports them.
    include: [
      'react-router',
      '@xyflow/react',
      'beautiful-mermaid',
      'dompurify',
      'react-markdown',
      'remark-gfm',
      'rehype-raw',
      'react-datepicker',
    ],
  },
})
