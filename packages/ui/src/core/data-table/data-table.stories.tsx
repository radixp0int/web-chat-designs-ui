import { useMemo, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import {
  STATUS_LABEL,
  STATUS_TONE,
  TENANTS,
  fmtDate,
  type Tenant,
} from '../../__fixtures__/tenants'
import { IconButton } from '../../components/icon-button'
import { DotsIcon, PencilIcon, TrashIcon } from '../../components/icons'
import { Avatar } from '../avatar'
import { Button } from '../button'
import { Pagination } from '../pagination'
import type { Sort } from '../paging'
import { Pill } from '../pill'
import { DataTable } from './data-table'
import type { Column } from './types'

const COLUMNS: Column<Tenant>[] = [
  {
    id: 'name',
    header: 'Name',
    sortKey: 'name',
    width: '26%',
    cell: (t) => (
      <span className="flex items-center gap-2.5">
        <Avatar variant="text" text={t.initials} size={28} tone="soft" aria-hidden />
        <span className="truncate font-bold text-ink-strong">{t.name}</span>
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    sortKey: 'status',
    width: '13%',
    cell: (t) => <Pill tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Pill>,
  },
  {
    id: 'contact',
    header: 'Primary contact',
    sortKey: 'contact',
    width: '18%',
    hideBelow: 'lg',
    cell: (t) => <span className="truncate">{t.contact}</span>,
  },
  {
    id: 'email',
    header: 'Email',
    sortKey: 'email',
    width: '22%',
    hideBelow: 'xl',
    cell: (t) => <span className="block truncate text-ink-soft">{t.email}</span>,
  },
  {
    id: 'seats',
    header: 'Seats',
    align: 'end',
    width: '10%',
    hideBelow: 'md',
    cell: (t) => (
      <span className="tabular-nums">
        {t.seats[0]} / {t.seats[1]}
      </span>
    ),
  },
  {
    id: 'created',
    header: 'Created',
    sortKey: 'created',
    hideBelow: 'md',
    cell: (t) => <span className="whitespace-nowrap text-ink-soft">{fmtDate(t.created)}</span>,
  },
]

function sortRows(rows: Tenant[], sort: Sort[]) {
  const s = sort[0]
  if (!s) return rows
  const dir = s.direction === 'asc' ? 1 : -1
  return [...rows].sort(
    (a, b) =>
      String(a[s.field as keyof Tenant]).localeCompare(String(b[s.field as keyof Tenant])) * dir,
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10.5px] font-extrabold tracking-[0.06em] text-ink-soft uppercase">
        {label}
      </span>
      <span className="text-[13.5px] text-ink">{children}</span>
    </div>
  )
}

const meta = {
  title: 'Data Table/DataTable',
  component: DataTable<Tenant>,
  tags: ['autodocs'],
  args: {
    caption: 'Tenants',
    columns: COLUMNS,
    rows: TENANTS.slice(0, 6),
    rowId: (t: Tenant) => t.id,
  },
  argTypes: {
    columns: { control: false },
    rows: { control: false },
    toolbar: { control: false },
    footer: { control: false },
    empty: { control: false },
    bulkActions: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The table fetches nothing and remembers nothing. Sort, selection, expansion and paging are all props, so a client-side fixture and a paged API drive it identically. `table-fixed` columns honour their `width`; `hideBelow` sheds low-priority columns before the rest get squeezed; `minWidth` makes it scroll rather than overlap.',
      },
    },
  },
} satisfies Meta<typeof DataTable<Tenant>>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {}

export const Sortable: Story = {
  render: function SortableStory(args) {
    const [sort, setSort] = useState<Sort[]>([{ field: 'name', direction: 'asc' }])
    const rows = useMemo(() => sortRows(TENANTS.slice(0, 8), sort), [sort])
    return <DataTable {...args} rows={rows} sort={sort} onSortChange={setSort} />
  },
}

/** Tick a row and the bulk bar replaces the header. */
export const SelectionWithBulkActions: Story = {
  render: function SelectionStory(args) {
    const [selected, setSelected] = useState<string[]>([TENANTS[1].id, TENANTS[3].id])
    return (
      <DataTable
        {...args}
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={
          <>
            <Button variant="inverse" size="sm">
              Change status
            </Button>
            <Button variant="inverse" size="sm">
              Assign owner
            </Button>
          </>
        }
      />
    )
  },
}

/** Supplying `renderExpanded` makes rows clickable; row actions never toggle. */
export const ExpandableWithRowActions: Story = {
  render: function ExpandStory(args) {
    const [expanded, setExpanded] = useState<string[]>([TENANTS[0].id])
    return (
      <DataTable
        {...args}
        expandedIds={expanded}
        onExpandedChange={setExpanded}
        renderExpanded={(t) => (
          <div className="grid grid-cols-4 gap-x-6 gap-y-4 max-md:grid-cols-2">
            <Detail label="Tenant ID">
              <span className="font-bold tabular-nums">{t.id}</span>
            </Detail>
            <Detail label="Plan tier">{t.tier}</Detail>
            <Detail label="Region">{t.region}</Detail>
            <Detail label="Renewal">{fmtDate(t.renewal)}</Detail>
          </div>
        )}
        rowActions={(t) => (
          <>
            <IconButton size="sm" shape="rounded" aria-label={`Edit ${t.name}`} title="Edit">
              <PencilIcon width={14} height={14} />
            </IconButton>
            <IconButton size="sm" shape="rounded" aria-label={`Delete ${t.name}`} title="Delete">
              <TrashIcon width={14} height={14} />
            </IconButton>
            <IconButton
              size="sm"
              shape="rounded"
              aria-label={`More actions for ${t.name}`}
              title="More"
            >
              <DotsIcon width={14} height={14} />
            </IconButton>
          </>
        )}
      />
    )
  },
}

/** Skeleton rows keep the header and frame; match `skeletonRows` to the page size. */
export const Loading: Story = { args: { loading: true, skeletonRows: 6 } }

export const Empty: Story = {
  args: {
    rows: [],
    labels: {
      emptyTitle: 'No tenants match',
      emptyBody: <span className="text-[13px] text-ink-soft">Try removing a filter.</span>,
    },
  },
}

export const CustomEmptyState: Story = {
  args: {
    rows: [],
    empty: (
      <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <p className="text-[15px] font-extrabold text-ink-strong">No tenants yet</p>
        <p className="max-w-sm text-[13px] text-ink-soft">
          Tenants appear here once they accept an invitation.
        </p>
        <Button variant="primary" size="sm" onClick={fn()}>
          Invite a tenant
        </Button>
      </div>
    ),
  },
}

/** Squeeze the canvas: columns drop at their breakpoints, then the table scrolls. */
export const NarrowContainer: Story = {
  args: { minWidth: '640px' },
  decorators: [(Story) => <div className="max-w-md">{Story()}</div>],
}

/** Paged client-side; the footer is just a `Pagination`. */
export const WithPagination: Story = {
  render: function PagedStory(args) {
    const [page, setPage] = useState(1)
    const [size, setSize] = useState(5)
    const totalPages = Math.ceil(TENANTS.length / size)
    return (
      <DataTable
        {...args}
        rows={TENANTS.slice((page - 1) * size, page * size)}
        footer={
          <Pagination
            page={page}
            size={size}
            totalElements={TENANTS.length}
            totalPages={totalPages}
            onPageChange={setPage}
            onSizeChange={(n) => {
              setSize(n)
              setPage(1)
            }}
            sizeOptions={[5, 10, 25]}
          />
        }
      />
    )
  },
}
