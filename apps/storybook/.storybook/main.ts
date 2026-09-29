import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import type { StorybookConfig } from '@storybook/react-vite'

// Stories live beside the module they describe — `button/button.stories.tsx`
// next to `button/button.tsx` — so a folder copied out of this repo takes its
// scenarios with it. This workspace only collects them. The globs are relative
// to this file, which is three levels below the repo root.
const ROOT = '../../..'

// Fonts and the colour-scheme meta come from the same snippet every app's
// index.html gets, so a story renders in the brand face. Its pre-paint script
// is dropped: here the toolbar, not localStorage, decides the theme (see
// preview.tsx), and the two would race.
function tokensHead(): string {
  const file = createRequire(import.meta.url).resolve('@chat/tokens/head.html')
  return readFileSync(file, 'utf8')
    .replace(/<script[\s\S]*?<\/script>\s*/g, '')
    .replace(/<!--[\s\S]*?-->\s*/g, '')
}

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: [
    // Handbook: introduction, conventions, contracts, release notes.
    '../src/**/*.mdx',
    // @chat/ui — primitives, generic components, the data table — and
    // @chat/chat-ui — the chat components, recipes and the widget. MDX here is
    // a module's attached contract page (see core/paging/paging.mdx).
    `${ROOT}/packages/*/src/**/*.@(mdx|stories.@(ts|tsx))`,
    // App-level recipes that have not been lifted into a package yet.
    `${ROOT}/apps/chat/src/**/*.stories.@(ts|tsx)`,
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  // Props tables are read from each module's types.ts. react-docgen-typescript
  // follows those imports and the `Omit<…HTMLAttributes…> & {…}` intersections
  // the primitives are written in; the filter keeps the tables to the props a
  // module declares itself, not the few hundred it inherits from the DOM.
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => !prop.parent || !/node_modules/.test(prop.parent.fileName),
      // The plugin documents the tsconfig's files that ALSO match these globs,
      // resolved from this workspace — its default (`**/*.tsx`) never leaves
      // apps/storybook, so without them no package gets a props table.
      include: ['../../packages/*/src/**/*.tsx', '../../apps/chat/src/demo/workflow-demo/**/*.tsx'],
      // glob normalises ../../apps/chat to ../chat, so both depths are listed.
      exclude: ['../**/*.stories.tsx', '../../**/*.stories.tsx'],
    },
  },
  previewHead: (head) => `${head}\n${tokensHead()}`,
  core: { disableTelemetry: true },
}

export default config
