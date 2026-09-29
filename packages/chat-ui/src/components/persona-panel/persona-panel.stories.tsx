import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { personas, promptTemplates } from '../../__fixtures__/chat'
import { PersonaPanel } from './persona-panel'

const meta = {
  title: 'Recipes/Chat/PersonaPanel',
  component: PersonaPanel,
  tags: ['autodocs'],
  args: { personas, personaId: 'guide', onPersonaChange: fn(), templates: promptTemplates },
  render: function PanelStory(args) {
    const [id, setId] = useState(args.personaId)
    return <PersonaPanel {...args} personaId={id} onPersonaChange={setId} />
  },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
  parameters: {
    docs: {
      description: {
        component:
          'Persona select plus the stacked prompt templates in force. Ordered by each layer’s `priority`, not array order — the fixture is deliberately out of order. The textareas are `readOnly`, so the text stays selectable.',
      },
    },
  },
} satisfies Meta<typeof PersonaPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoTemplates: Story = { args: { templates: [] } }
