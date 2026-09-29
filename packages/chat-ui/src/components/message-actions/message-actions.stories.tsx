import type { Meta, StoryObj } from '@storybook/react-vite'
import { CopyButton, IconButton, RefreshIcon } from '@chat/ui'
import { MessageActions } from './message-actions'

const actions = (
  <>
    <CopyButton text="Your operating accounts are within policy." size="sm" />
    <IconButton size="sm" aria-label="Regenerate" title="Regenerate">
      <RefreshIcon width={14} height={14} />
    </IconButton>
  </>
)

const meta = {
  title: 'Recipes/Chat/MessageActions',
  component: MessageActions,
  tags: ['autodocs'],
  args: { children: actions, reveal: false },
  argTypes: { children: { control: false } },
  parameters: {
    docs: {
      description: {
        component:
          'The row of controls under a message. `reveal` hides it with opacity rather than `display`, so it keeps its place in the tab order and the transcript doesn’t jump when a pointer crosses it. The turn must carry `group/turn`.',
      },
    },
  },
} satisfies Meta<typeof MessageActions>

export default meta
type Story = StoryObj<typeof meta>

export const AlwaysShown: Story = {}

/** Hover the turn, or tab into it, to reveal the row. */
export const RevealOnHover: Story = {
  args: { reveal: true },
  render: (args) => (
    <div className="group/turn max-w-md rounded-surface border border-dashed border-line p-4">
      <p className="text-[14px] text-ink">Hover this turn to reveal its actions.</p>
      <MessageActions {...args} />
    </div>
  ),
}
