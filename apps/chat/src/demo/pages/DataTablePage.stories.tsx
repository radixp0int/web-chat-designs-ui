import type { Meta, StoryObj } from '@storybook/react-vite'
import { DataTablePage } from './DataTablePage'

// The /data-table route as a story, rendered as-is rather than copied: the
// page is the recipe — omnibox on top, a filter rail that docks or floats, and
// pagination in the card's footer — with every piece of state held by the host.
const meta = {
  title: 'Data Table/Recipes/Tenants page',
  component: DataTablePage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Everything stateful lives in the page — query, facets, sort, page, selection, expansion. It does client-side what a real page hands to the API, and neither `DataTable` nor its props change when it does.',
      },
    },
  },
} satisfies Meta<typeof DataTablePage>

export default meta
type Story = StoryObj<typeof meta>

export const TenantsPage: Story = { name: 'Tenants page' }
