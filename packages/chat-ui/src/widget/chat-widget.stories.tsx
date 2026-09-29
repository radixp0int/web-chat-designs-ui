import { useMemo, useRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { HistoryIcon, SparkleIcon } from '@chat/ui'
import {
  cannedTurns,
  personas,
  promptTemplates,
  recentChats,
  suggestions,
  typeaheadPool,
} from '../__fixtures__/chat'
import { PersonaPanel } from '../components/persona-panel'
import { RecentChatsPanel } from '../components/recent-chats-panel'
import { createCannedResponder } from '../engine/chatEngine'
import type { SidePanel } from '../types'
import { ChatWidget, type WidgetController, type WidgetPosition } from './ChatWidget'

const PROFILE = { name: 'Dana Whitfield', loginId: 'dwhitfield' }
const useProfile = () => PROFILE

const SIDE_PANELS: SidePanel[] = [
  {
    id: 'recent',
    label: 'Recent chats',
    icon: <HistoryIcon width={16} height={16} />,
    title: 'Recent chats',
    content: <RecentChatsPanel chats={recentChats} activeId="current" onSelect={() => {}} />,
  },
  {
    id: 'persona',
    label: 'Persona',
    icon: <SparkleIcon width={16} height={16} />,
    title: 'Persona selection',
    content: (
      <PersonaPanel
        personas={personas}
        personaId="guide"
        onPersonaChange={() => {}}
        templates={promptTemplates}
      />
    ),
  },
]

/**
 * Rendered straight into the page rather than through `mountWidget`'s shadow
 * root, so it picks up the toolbar's palette and mode like any other story.
 * The shadow-root path — the one a host site uses — is the "Widget on a host
 * page" recipe.
 */
function Widget({ position = 'bottom-right' }: { position?: WidgetPosition }) {
  const responder = useMemo(() => createCannedResponder(cannedTurns), [])
  const controller = useRef(null) as WidgetController
  return (
    <div className="relative h-dvh bg-canvas p-8">
      <p className="max-w-md text-[13px] text-ink-soft">
        The launcher sits in the corner. Open it, ask a question, expand the panel, or try the side
        rail’s tabs.
      </p>
      <ChatWidget
        responder={responder}
        branding={{
          appName: 'Aristotle',
          modelName: 'Aristotle',
          disclaimer: 'AI can make mistakes. Verify important details.',
        }}
        suggestions={suggestions}
        typeaheadPool={typeaheadPool}
        starters={[]}
        sidePanels={SIDE_PANELS}
        launcherLabel="Ask Aristotle"
        useProfile={useProfile}
        initialTheme="auto"
        position={position}
        zIndex={50}
        controller={controller}
      />
    </div>
  )
}

const meta = {
  title: 'Recipes/Chat/ChatWidget',
  component: ChatWidget,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The floating launcher plus the pop-in panel. Chat state lives here, and the panel is hidden with CSS rather than unmounted — the conversation and draft survive closing and reopening.',
      },
    },
  },
} satisfies Meta<typeof ChatWidget>

export default meta
type Story = StoryObj<typeof ChatWidget>

export const BottomRight: Story = { render: () => <Widget /> }

export const BottomLeft: Story = { render: () => <Widget position="bottom-left" /> }
