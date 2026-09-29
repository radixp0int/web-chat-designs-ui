import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { highlights, sources } from '../../__fixtures__/chat'
import type { Source } from '../../types'
import { ReferencePanel } from './reference-panel'

const MANY: Source[] = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  title: `Working paper ${i + 1}`,
  fileType: 'PDF',
  pageCount: 3 + (i % 9),
  markdown: `## Working paper ${i + 1}\n\nOne of 24 generated references, for exercising the pill rail and arrow-key navigation across a long list.`,
}))

const meta = {
  title: 'Recipes/Chat/ReferencePanel',
  component: ReferencePanel,
  tags: ['autodocs'],
  args: { sources, activeId: 1, highlights, onSelect: fn(), onClose: fn() },
  render: function PanelStory(args) {
    const [active, setActive] = useState(args.activeId)
    return <ReferencePanel {...args} activeId={active} onSelect={setActive} />
  },
  decorators: [
    (Story) => (
      <div className="flex h-[34rem] w-[30rem] flex-col overflow-hidden rounded-surface border border-line bg-panel-solid">
        {Story()}
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The reader: one reference with prev/next, a numbered pill rail and arrow keys — jumping from 2 to 21 is one gesture. Cited passages are highlighted in the toolbar’s Highlight colour. A wheel mouse scrolls the rail sideways.',
      },
    },
  },
} satisfies Meta<typeof ReferencePanel>

export default meta
type Story = StoryObj<typeof meta>

/** Source 1 has two highlighted passages; switch the Highlight toolbar to recolour them. */
export const WithHighlights: Story = {}

export const ManyReferences: Story = { args: { sources: MANY, activeId: 12, highlights: [] } }

/** The mobile widget slide-over: close becomes a back button. */
export const BackButton: Story = { args: { backLabel: 'Back to chat' } }
