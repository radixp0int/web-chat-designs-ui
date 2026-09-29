import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import App from './App'

// The /chat route, rendered as-is: sidebar, top bar, conversation, reference
// pane, settings dialogs — everything the library looks like assembled into a
// product. It streams from the canned turns unless VITE_WS_URL is set.
const meta = {
  title: 'Recipes/Chat/Full chat app',
  component: App,
  // The sidebar links back to the demos, so it needs a router like any route.
  decorators: [(Story) => <MemoryRouter initialEntries={['/chat']}>{Story()}</MemoryRouter>],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof App>

export default meta
type Story = StoryObj<typeof meta>

export const Aristotle: Story = {}
