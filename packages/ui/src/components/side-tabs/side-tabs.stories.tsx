import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { FunnelIcon, HistoryIcon, SparkleIcon } from '../icons'
import { SideTabPanel, SideTabRail } from './side-tabs'
import type { SideTab } from './types'

const TABS: SideTab[] = [
  { id: 'filters', label: 'Filters', icon: <FunnelIcon width={16} height={16} />, badge: 3 },
  { id: 'recent', label: 'Recent chats', icon: <HistoryIcon width={16} height={16} /> },
  { id: 'persona', label: 'Persona', icon: <SparkleIcon width={16} height={16} /> },
]

const meta = {
  title: 'Primitives/Components/SideTabs',
  component: SideTabRail,
  tags: ['autodocs'],
  args: { tabs: TABS, activeId: 'filters', onSelect: fn() },
  parameters: {
    docs: {
      description: {
        component:
          'A vertical icon rail with slide-in panels. A tab is an id + icon + label (+ optional count badge); the host decides what each panel holds. Clicking the active tab again calls `onSelect(null)`.',
      },
    },
  },
} satisfies Meta<typeof SideTabRail>

export default meta
type Story = StoryObj<typeof meta>

export const Rail: Story = {}

export const RailAndPanel: Story = {
  render: function RailStory() {
    const [active, setActive] = useState<string | null>('filters')
    const tab = TABS.find((t) => t.id === active)
    return (
      <div className="flex h-80 w-[26rem] overflow-hidden rounded-surface border border-line bg-panel-solid">
        <SideTabRail tabs={TABS} activeId={active} onSelect={setActive} />
        {tab ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <SideTabPanel title={tab.label} onClose={() => setActive(null)}>
              <p className="text-[13px] text-ink-soft">
                The host supplies this body for the <strong>{tab.label}</strong> tab.
              </p>
            </SideTabPanel>
          </div>
        ) : (
          <div className="grid flex-1 place-items-center text-[13px] text-ink-soft">
            Chat column
          </div>
        )}
      </div>
    )
  },
}
