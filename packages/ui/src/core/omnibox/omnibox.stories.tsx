import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Omnibox } from './omnibox'
import type { OmniboxChip, OmniboxGroup } from './types'

const FIELDS = [
  { key: 'name', label: 'Name', glyph: 'Aa', param: 'name__icontains' },
  { key: 'email', label: 'Email', glyph: '@', param: 'email__icontains' },
  { key: 'contact', label: 'Primary contact', glyph: '◔', param: 'contact__icontains' },
]

const kbd = (
  <kbd className="shrink-0 rounded border border-line bg-canvas px-1.5 py-0.5 text-[11px] font-bold text-ink-soft">
    ⌘K
  </kbd>
)

/**
 * The DataTable toolbar's search: typing proposes, choosing commits. Each
 * suggestion names the query parameter it would produce, so the difference
 * between "search everything" and "narrow a field" is visible before you pick.
 */
function Host({
  initialChips = [] as OmniboxChip[],
  hints,
}: {
  initialChips?: OmniboxChip[]
  hints?: React.ReactNode
}) {
  const [draft, setDraft] = useState('')
  const [chips, setChips] = useState<OmniboxChip[]>(initialChips)
  const remove = (id: string) => setChips((c) => c.filter((x) => x.id !== id))
  const add = (chip: Omit<OmniboxChip, 'onRemove'>) => {
    setChips((c) => [...c, { ...chip, onRemove: () => remove(chip.id) }])
    setDraft('')
  }
  const q = draft.trim()
  const groups: OmniboxGroup[] = q
    ? [
        {
          id: 'all',
          label: 'Search every field',
          items: [
            {
              id: 'search-all',
              icon: '⌕',
              label: (
                <>
                  Search for <strong className="font-extrabold">“{q}”</strong>
                </>
              ),
              hint: `?search=${q}`,
              onSelect: () => add({ id: `search-${Date.now()}`, prefix: 'search:', label: q }),
            },
          ],
        },
        {
          id: 'fields',
          label: 'Narrow to a field',
          items: FIELDS.map((f) => ({
            id: f.key,
            icon: f.glyph,
            label: (
              <>
                {f.label} contains <strong className="font-extrabold">{q}</strong>
              </>
            ),
            hint: f.param,
            onSelect: () =>
              add({ id: `${f.key}-${Date.now()}`, prefix: `${f.label.toLowerCase()}:`, label: q }),
          })),
        },
      ]
    : []
  return (
    <Omnibox
      label="Search and filter tenants"
      placeholder="Search, or type to narrow to a field…"
      value={draft}
      onValueChange={setDraft}
      chips={chips.map((c) => ({ ...c, onRemove: c.onRemove ?? (() => remove(c.id)) }))}
      groups={groups}
      onRemoveLast={() => setChips((c) => c.slice(0, -1))}
      suffix={kbd}
      hints={hints}
      className="w-[36rem] max-w-full"
    />
  )
}

const meta = {
  title: 'Data Table/Omnibox',
  component: Omnibox,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="min-h-80">{Story()}</div>],
  parameters: {
    docs: {
      description: {
        component:
          'One field for free-text search and field-scoped filters. Active filters render as chips inside the outline; Backspace on an empty field removes the last one when `onRemoveLast` is given. Type to see the suggestion groups.',
      },
    },
  },
} satisfies Meta<typeof Omnibox>

export default meta
type Story = StoryObj<typeof Omnibox>

export const Empty: Story = { render: () => <Host /> }

export const WithChips: Story = {
  render: () => (
    <Host
      initialChips={[
        { id: 's', prefix: 'search:', label: 'crest' },
        { id: 'st', prefix: 'status:', label: 'Active' },
        { id: 't', prefix: 'tier:', label: 'Enterprise' },
      ]}
    />
  ),
}

/** `hints={null}` drops the keyboard legend under the suggestions. */
export const NoKeyboardLegend: Story = { render: () => <Host hints={null} /> }
