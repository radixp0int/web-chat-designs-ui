import type { Decorator, Preview } from '@storybook/react-vite'
// Deep paths, not the `@chat/ui` / `@chat/chat-ui` barrels. The preview loads
// before every story, and a barrel import here would pull every module of
// both packages — mermaid included — into it, defeating the per-story chunks.
// The files are the same ones the barrels re-export, so the contexts match.
import { SHIPPED_HIGHLIGHTS } from '../../../packages/ui/src/settings/appearance'
import { UiSizeProvider, type UiSize } from '../../../packages/ui/src/uiSize'
import { BrandingProvider, type Branding } from '../../../packages/chat-ui/src/branding'
import { ThemeScope } from './theme-scope'
import './storybook.css'

// The toolbar. Every axis the brand varies on, and nothing else: mode, palette,
// highlight colour and density. They are globals rather than per-story args so
// one flip re-skins every story and every docs page at once.
const PALETTES = [
  { value: 'default', title: 'Navy (default)' },
  { value: 'aristotle1', title: 'Aristotle 1' },
  { value: 'aristotle2', title: 'Deep' },
  { value: 'graphite', title: 'Graphite' },
]

const branding: Branding = {
  appName: 'Aristotle',
  modelName: 'Aristotle',
  disclaimer: 'AI can make mistakes. Verify important details.',
}

const withTheme: Decorator = (Story, { globals }) => (
  <ThemeScope mode={globals.mode} palette={globals.palette} highlight={globals.highlight}>
    <UiSizeProvider value={globals.density as UiSize}>
      <BrandingProvider value={branding}>
        <Story />
      </BrandingProvider>
    </UiSizeProvider>
  </ThemeScope>
)

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    mode: {
      description: 'Colour mode',
      toolbar: {
        title: 'Mode',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    palette: {
      description: 'Brand palette — a chat-theme-* class from brand.css',
      toolbar: { title: 'Palette', icon: 'paintbrush', items: PALETTES, dynamicTitle: true },
    },
    highlight: {
      description: 'Cited-passage <mark> colour — a chat-highlight-* class',
      toolbar: {
        title: 'Highlight',
        icon: 'markup',
        items: SHIPPED_HIGHLIGHTS.map((h) => ({ value: h.id, title: h.label })),
        dynamicTitle: true,
      },
    },
    density: {
      description: 'UiSizeProvider — the widget runs compact',
      toolbar: {
        title: 'Density',
        icon: 'component',
        items: [
          { value: 'default', title: 'Default' },
          { value: 'compact', title: 'Compact (widget)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    mode: 'light',
    palette: 'default',
    highlight: 'orange',
    density: 'default',
  },
  parameters: {
    layout: 'padded',
    // The palette owns the canvas colour; Storybook's own swatches would fight it.
    backgrounds: { disabled: true },
    controls: {
      expanded: true,
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: { test: 'todo' },
    options: {
      storySort: {
        order: [
          'Docs',
          ['Introduction', 'Module anatomy', 'Theming', 'Contracts', 'Release notes'],
          'Primitives',
          ['Core', 'Components'],
          'Data Table',
          'Recipes',
          ['Chat', 'Workflows'],
        ],
      },
    },
  },
}

export default preview
