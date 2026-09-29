import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { sources } from '../../__fixtures__/chat'
import type { Source } from '../../types'
import { SourceStrip } from './source-strip'

const MANY: Source[] = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  title: `Working paper ${i + 1}`,
  markdown: '',
  fileType: i % 3 ? 'PDF' : 'XLSX',
}))

const meta = {
  title: 'Recipes/Chat/SourceStrip',
  component: SourceStrip,
  tags: ['autodocs'],
  args: { sources, onCite: fn() },
  decorators: [(Story) => <div className="max-w-3xl">{Story()}</div>],
  parameters: {
    docs: {
      description: { component: 'The compact row of numbered source pills under an answer.' },
    },
  },
} satisfies Meta<typeof SourceStrip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Many: Story = { args: { sources: MANY } }
