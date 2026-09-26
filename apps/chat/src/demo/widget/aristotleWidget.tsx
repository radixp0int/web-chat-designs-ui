import {
  createCannedResponder,
  createWsResponder,
  type SidePanel,
  type WidgetContent,
  type WidgetPosition,
  mountWidget,
  type MountOptions,
  type WidgetHandle,
  type ThemeMode,
} from '@chat/chat-ui'
import { SparkleIcon } from '@chat/ui'
// Not @chat/chat-ui's own widget.css: the side panels below render inside the
// shadow root, so this sheet also scans this folder. See widget.css.
import cssText from './widget.css?inline'
import { aristotleBranding } from '../config'
import { cannedTurns } from '../mocks/cannedTurns'
import { todaysSuggestions, typeaheadPool } from '../mocks/suggestions'
import { DemoFacetFiltersPanel, DemoPersonaPanel, FiltersRailIcon } from './sidePanels'
import { useDemoComposerFeatures } from '../demoFeatures'
import { useDemoScope } from '../useDemoFacets'
import { useHostProfile } from './useHostProfile'

// Short starters sized for the narrow panel — the full Hero doesn't fit here.
const starters: string[] = []

// The demo's side-rail tabs, injected into the (generic) library widget.
function buildSidePanels(): SidePanel[] {
  return [
    {
      id: 'filters',
      label: 'Filters',
      // Carries its own badge rather than taking the rail's: the rail's is a
      // number fixed when the widget mounts, and this one changes every tick.
      icon: <FiltersRailIcon />,
      title: 'Filters',
      // The body pins a footer, so it lays itself out.
      fill: true,
      content: ({ close }) => <DemoFacetFiltersPanel onDone={close} />,
    },
    {
      id: 'persona',
      label: 'Persona',
      icon: <SparkleIcon width={16} height={16} />,
      title: 'Persona selection',
      content: <DemoPersonaPanel />,
    },
  ]
}

// Assemble the Aristotle-specific content that makes the library widget concrete.
function buildContent(): WidgetContent {
  // With VITE_WS_URL set, stream from the mock WS server; else canned demo.
  const wsUrl = import.meta.env.VITE_WS_URL as string | undefined
  const responder = wsUrl ? createWsResponder(wsUrl) : createCannedResponder(cannedTurns)
  return {
    responder,
    branding: aristotleBranding,
    suggestions: todaysSuggestions,
    typeaheadPool,
    useFeatures: useDemoComposerFeatures,
    starters,
    sidePanels: buildSidePanels(),
    launcherLabel: 'Ask Aristotle',
    useProfile: useHostProfile,
    // Read inside the widget so the recorded scope, and the "changed since"
    // badge on older questions, stay live as the Filters panel is used.
    useScope: useDemoScope,
  }
}

export type AristotleChatOptions = Omit<MountOptions, 'cssText'>
export type AristotleChatHandle = WidgetHandle

/** Mount the Aristotle chat widget. Returns a handle to control or remove it. */
export function init(options: AristotleChatOptions = {}): AristotleChatHandle {
  return mountWidget(buildContent(), { ...options, cssText })
}

// Auto-init when loaded via a classic script tag carrying data-auto-init:
//   <script src=".../aristotle-widget.js" data-auto-init data-theme="auto"
//           data-theme-class="chat-theme-aristotle2"></script>
// (document.currentScript is null in module scripts, so this requires a
// classic tag; module consumers call init() themselves.)
const script = document.currentScript as HTMLScriptElement | null
if (script && script.dataset.autoInit !== undefined) {
  const boot = () =>
    init({
      theme: script.dataset.theme as ThemeMode | undefined,
      themeClass: script.dataset.themeClass,
      position: script.dataset.position as WidgetPosition | undefined,
    })
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true })
  } else {
    boot()
  }
}
