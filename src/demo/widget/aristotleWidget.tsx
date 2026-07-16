import { createCannedResponder } from '../../lib/engine/chatEngine'
import { createWsResponder } from '../../lib/engine/wsResponder'
import { FunnelIcon, HistoryIcon } from '../../lib/components/Icons'
import type { SidePanel } from '../../lib/types'
import type { WidgetContent, WidgetPosition } from '../../lib/widget/ChatWidget'
import { mountWidget, type MountOptions, type WidgetHandle } from '../../lib/widget/mount'
import type { ThemeMode } from '../../lib/widget/useHostTheme'
import { aristotleBranding } from '../config'
import { cannedTurns } from '../mocks/cannedTurns'
import { demoFilters } from '../mocks/sideTabData'
import { personas } from '../personas'
import { DemoFiltersPanel, DemoRecentChatsPanel } from './sidePanels'
import { useHostProfile } from './useHostProfile'

// Short starters sized for the narrow panel — the full Hero doesn't fit here.
const starters = [
  'Help me build a monthly budget',
  'How big should my emergency fund be?',
  'Explain index funds simply',
]

// The demo's side-rail tabs, injected into the (generic) library widget.
function buildSidePanels(): SidePanel[] {
  return [
    {
      id: 'filters',
      label: 'Filters',
      icon: <FunnelIcon width={16} height={16} />,
      badge: demoFilters.length,
      title: 'Filters',
      content: <DemoFiltersPanel />,
    },
    {
      id: 'recents',
      label: 'Recent chats',
      icon: <HistoryIcon width={16} height={16} />,
      title: 'Recent chats',
      content: <DemoRecentChatsPanel />,
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
    personas,
    starters,
    sidePanels: buildSidePanels(),
    useProfile: useHostProfile,
  }
}

export type AristotleChatOptions = MountOptions
export type AristotleChatHandle = WidgetHandle

/** Mount the Aristotle chat widget. Returns a handle to control or remove it. */
export function init(options: AristotleChatOptions = {}): AristotleChatHandle {
  return mountWidget(buildContent(), options)
}

// Auto-init when loaded via a classic script tag carrying data-auto-init:
//   <script src=".../aristotle-widget.js" data-auto-init data-theme="auto"></script>
// (document.currentScript is null in module scripts, so this requires a
// classic tag; module consumers call init() themselves.)
const script = document.currentScript as HTMLScriptElement | null
if (script && script.dataset.autoInit !== undefined) {
  const boot = () =>
    init({
      theme: script.dataset.theme as ThemeMode | undefined,
      position: script.dataset.position as WidgetPosition | undefined,
    })
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true })
  } else {
    boot()
  }
}
