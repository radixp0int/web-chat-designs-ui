import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { WidgetDemoPage } from './WidgetDemoPage'

// The /widget-demo route: a fictional host site that mounts the widget with the
// same init() its script tag calls — into a shadow root, with its own
// stylesheet. The one story where the widget does NOT follow Storybook's
// toolbar: across the shadow boundary it takes only what init() is given,
// which is the proof this page exists for.
const meta = {
  title: 'Recipes/Chat/Widget on a host page',
  component: WidgetDemoPage,
  decorators: [(Story) => <MemoryRouter>{Story()}</MemoryRouter>],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof WidgetDemoPage>

export default meta
type Story = StoryObj<typeof meta>

export const AlderAndFinch: Story = { name: 'Alder & Finch' }
