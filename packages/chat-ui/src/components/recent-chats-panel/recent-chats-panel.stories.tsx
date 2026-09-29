import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { recentChats } from '../../__fixtures__/chat'
import { RecentChatsPanel } from './recent-chats-panel'

const meta = {
  title: 'Recipes/Chat/RecentChatsPanel',
  component: RecentChatsPanel,
  tags: ['autodocs'],
  args: { chats: recentChats, activeId: 'current', onSelect: fn() },
  render: function RecentStory(args) {
    const [active, setActive] = useState(args.activeId)
    return <RecentChatsPanel {...args} activeId={active} onSelect={setActive} />
  },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
  parameters: {
    docs: {
      description: {
        component: 'Recent conversations to switch between. Presentational — selection is UI-only.',
      },
    },
  },
} satisfies Meta<typeof RecentChatsPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = { args: { chats: [] } }
