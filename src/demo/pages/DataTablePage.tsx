// Unlisted, like /primitives. The H/I shell from the design canvas assembled
// around <DataTable/>: omnibox on top, collapsible facet rail beside it,
// pagination in the card's footer.
//
// Everything stateful lives HERE, in the host — the query, the facets, the
// sort, the page, the selection, the expansion. That is the point of the
// exercise: DataTable fetches nothing and remembers nothing, so this page does
// client-side what a real one would hand to the API, and neither the component
// nor its props change when it does.
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  DataTable,
  FilterPanel,
  Omnibox,
  Pagination,
  Pill,
  formatSort,
  type Column,
  type DateRange,
  type FilterField,
  type Sort,
} from '../../lib/core'
import { IconButton } from '../../lib/components/icon-button'
import { DotsIcon, FunnelIcon, PencilIcon, TrashIcon } from '../../lib/components/icons'
import { ThemeToggle } from '../components/ThemeToggle'

type Status = 'active' | 'pending' | 'suspended'
type FieldKey = 'name' | 'email' | 'contact'

/** Label, glyph and the query parameter each narrowing produces. */
const FIELDS: { key: FieldKey; label: string; glyph: string; param: string }[] = [
  { key: 'name', label: 'Name', glyph: 'Aa', param: 'name__icontains' },
  { key: 'email', label: 'Email', glyph: '@', param: 'email__icontains' },
  { key: 'contact', label: 'Primary contact', glyph: '◔', param: 'contact__icontains' },
]

type Tenant = {
  id: string
  name: string
  initials: string
  status: Status
  contact: string
  email: string
  phone: string
  created: string
  tier: 'Enterprise' | 'Growth' | 'Starter'
  seats: [number, number]
  region: string
  renewal: string
}

const TENANTS: Tenant[] = [
  {
    id: 'tnt_8f42c19b',
    name: 'Crestview Bank',
    initials: 'CB',
    status: 'active',
    contact: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '908 645 3454',
    created: '2026-03-14',
    tier: 'Enterprise',
    seats: [412, 500],
    region: 'Northeast · NJ',
    renewal: '2026-09-30',
  },
  {
    id: 'tnt_2a77de05',
    name: 'Prosperity Bank',
    initials: 'PB',
    status: 'active',
    contact: 'Michael Smith',
    email: 'michael.s@example.com',
    phone: '654 765 2344',
    created: '2026-03-12',
    tier: 'Growth',
    seats: [88, 120],
    region: 'Midwest · IL',
    renewal: '2026-11-01',
  },
  {
    id: 'tnt_51c0b3aa',
    name: 'Liberty Savings & Loan',
    initials: 'LS',
    status: 'pending',
    contact: 'Emily Brown',
    email: 'emily.b@example.com',
    phone: '908 645 3454',
    created: '2026-03-09',
    tier: 'Starter',
    seats: [12, 25],
    region: 'Northeast · NY',
    renewal: '2027-01-15',
  },
  {
    id: 'tnt_9d31f7c2',
    name: 'Horizon National Bank',
    initials: 'HB',
    status: 'active',
    contact: 'David Rodriguez',
    email: 'david.r@example.com',
    phone: '856 746 8576',
    created: '2026-02-28',
    tier: 'Enterprise',
    seats: [903, 1000],
    region: 'West · CA',
    renewal: '2026-08-12',
  },
  {
    id: 'tnt_6b18ae44',
    name: 'Capital Trust Bank',
    initials: 'CT',
    status: 'suspended',
    contact: 'Jessica Nguyen',
    email: 'jessica.n@example.com',
    phone: '908 645 3454',
    created: '2026-02-21',
    tier: 'Growth',
    seats: [0, 150],
    region: 'South · TX',
    renewal: '2026-06-30',
  },
  {
    id: 'tnt_c402e8d1',
    name: 'Integrity Financial Corp.',
    initials: 'IC',
    status: 'active',
    contact: 'Christopher Lee',
    email: 'christopher.l@example.com',
    phone: '856 746 8576',
    created: '2026-02-14',
    tier: 'Enterprise',
    seats: [287, 400],
    region: 'Northeast · MA',
    renewal: '2026-12-01',
  },
  {
    id: 'tnt_7e95ba30',
    name: 'Summit Community Bank',
    initials: 'SB',
    status: 'active',
    contact: 'Ashley Taylor',
    email: 'ashley.t@example.com',
    phone: '908 645 3454',
    created: '2026-02-02',
    tier: 'Starter',
    seats: [19, 25],
    region: 'Midwest · OH',
    renewal: '2027-02-02',
  },
  {
    id: 'tnt_1f6cd982',
    name: 'Pinnacle Credit Union',
    initials: 'PC',
    status: 'pending',
    contact: 'Daniel Okafor',
    email: 'daniel.o@example.com',
    phone: '415 220 7781',
    created: '2026-01-27',
    tier: 'Growth',
    seats: [44, 120],
    region: 'West · WA',
    renewal: '2026-10-19',
  },
  {
    id: 'tnt_ab3390ef',
    name: 'Granite State Savings',
    initials: 'GS',
    status: 'active',
    contact: 'Priya Raman',
    email: 'priya.r@example.com',
    phone: '603 118 2290',
    created: '2026-01-19',
    tier: 'Enterprise',
    seats: [512, 600],
    region: 'Northeast · NH',
    renewal: '2026-07-22',
  },
  {
    id: 'tnt_44de1207',
    name: 'Bayshore Financial',
    initials: 'BF',
    status: 'active',
    contact: 'Marcus Webb',
    email: 'marcus.w@example.com',
    phone: '305 774 9912',
    created: '2026-01-11',
    tier: 'Growth',
    seats: [61, 120],
    region: 'South · FL',
    renewal: '2026-09-05',
  },
  {
    id: 'tnt_08bb5e73',
    name: 'Ironwood Mutual',
    initials: 'IM',
    status: 'suspended',
    contact: 'Helen Park',
    email: 'helen.p@example.com',
    phone: '312 665 4401',
    created: '2025-12-30',
    tier: 'Starter',
    seats: [0, 25],
    region: 'Midwest · MI',
    renewal: '2026-05-30',
  },
  {
    id: 'tnt_ee7712c8',
    name: 'Northgate Trust',
    initials: 'NT',
    status: 'active',
    contact: 'Tomas Alvarez',
    email: 'tomas.a@example.com',
    phone: '206 889 3345',
    created: '2025-12-18',
    tier: 'Enterprise',
    seats: [744, 800],
    region: 'West · OR',
    renewal: '2026-11-18',
  },
  {
    id: 'tnt_3c9a0b61',
    name: 'Fairfield Savings',
    initials: 'FS',
    status: 'pending',
    contact: 'Nia Coleman',
    email: 'nia.c@example.com',
    phone: '203 442 7756',
    created: '2025-12-04',
    tier: 'Growth',
    seats: [30, 120],
    region: 'Northeast · CT',
    renewal: '2026-12-04',
  },
  {
    id: 'tnt_5da6f4e9',
    name: 'Redstone Bancorp',
    initials: 'RB',
    status: 'active',
    contact: 'Owen Fitzgerald',
    email: 'owen.f@example.com',
    phone: '720 331 8890',
    created: '2025-11-22',
    tier: 'Growth',
    seats: [97, 120],
    region: 'West · CO',
    renewal: '2026-08-30',
  },
]

const STATUS_TONE = { active: 'brand', pending: 'caution', suspended: 'danger' } as const
const STATUS_LABEL = { active: 'Active', pending: 'Pending', suspended: 'Suspended' } as const

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })

/** One labelled value in the expanded panel. */
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

export function DataTablePage() {
  // `draft` is what is typed; nothing filters until it is committed from the
  // dropdown. That is why each suggestion names the parameter it produces —
  // the control is only worth learning if choosing between them is visible.
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [fieldFilters, setFieldFilters] = useState<
    { id: string; field: FieldKey; value: string }[]
  >([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [tiers, setTiers] = useState<string[]>([])
  const [region, setRegion] = useState('')
  const [seatedOnly, setSeatedOnly] = useState(false)
  const [createdRange, setCreatedRange] = useState<DateRange>({ from: null, to: null })

  // `open` is whether the panel is showing; `pinned` is where. Keeping them
  // separate is what lets the pin survive closing and reopening the panel.
  const [open, setOpen] = useState(true)
  const [pinned, setPinned] = useState(true)
  const anchorRef = useRef<HTMLDivElement>(null)

  const [sort, setSort] = useState<Sort[]>([{ field: 'name', direction: 'asc' }])
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(5)

  const [selected, setSelected] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string[]>([])

  const [loading, setLoading] = useState(false)

  // What a DRF `search=` would do, done locally: one term across several fields.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return TENANTS.filter((t) => {
      if (statuses.length > 0 && !statuses.includes(t.status)) return false
      if (tiers.length > 0 && !tiers.includes(t.tier)) return false
      for (const f of fieldFilters) {
        if (!String(t[f.field]).toLowerCase().includes(f.value.toLowerCase())) return false
      }
      if (region && !t.region.toLowerCase().includes(region.toLowerCase())) return false
      if (seatedOnly && t.seats[0] === 0) return false
      if (createdRange.from && t.created < createdRange.from) return false
      if (createdRange.to && t.created > createdRange.to) return false
      if (!q) return true
      return [t.name, t.contact, t.email, t.region].some((v) => v.toLowerCase().includes(q))
    })
  }, [search, fieldFilters, statuses, tiers, region, seatedOnly, createdRange])

  const sorted = useMemo(() => {
    const s = sort[0]
    if (!s) return filtered
    const dir = s.direction === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = String(a[s.field as keyof Tenant] ?? '')
      const bv = String(b[s.field as keyof Tenant] ?? '')
      return av.localeCompare(bv) * dir
    })
  }, [filtered, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / size))
  const safePage = Math.min(page, totalPages)
  const pageRows = sorted.slice((safePage - 1) * size, safePage * size)

  // Counts are computed against the OTHER filters, not the whole set — which is
  // what makes a facet count mean "how many would I get if I ticked this".
  // Floating only: a docked panel is part of the page and must not vanish
  // when you click the table it is filtering.
  useEffect(() => {
    if (pinned || !open) return
    const onDown = (e: PointerEvent) => {
      if (!anchorRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [pinned, open])

  const statusCounts = useMemo(() => {
    const base = TENANTS.filter((t) => tiers.length === 0 || tiers.includes(t.tier))
    return {
      active: base.filter((t) => t.status === 'active').length,
      pending: base.filter((t) => t.status === 'pending').length,
      suspended: base.filter((t) => t.status === 'suspended').length,
    }
  }, [tiers])

  const activeFilters =
    statuses.length +
    tiers.length +
    fieldFilters.length +
    (search ? 1 : 0) +
    (region ? 1 : 0) +
    (seatedOnly ? 1 : 0) +
    (createdRange.from || createdRange.to ? 1 : 0)

  const resetRail = () => {
    setStatuses([])
    setTiers([])
    setRegion('')
    setSeatedOnly(false)
    setCreatedRange({ from: null, to: null })
    setPage(1)
  }

  const toggle = <V extends string>(list: V[], value: V, set: (v: V[]) => void) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
    setPage(1)
  }

  // What can be filtered, as data — one entry per type the panel supports.
  const filterFields: FilterField[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'options',
      value: statuses,
      options: (['active', 'pending', 'suspended'] as Status[]).map((st) => ({
        value: st,
        label: STATUS_LABEL[st],
        count: statusCounts[st],
      })),
      onChange: (v) => {
        setStatuses(v as Status[])
        setPage(1)
      },
    },
    {
      id: 'tier',
      label: 'Plan tier',
      type: 'options',
      value: tiers,
      options: ['Enterprise', 'Growth', 'Starter'].map((tier) => ({
        value: tier,
        label: tier,
        count: TENANTS.filter((t) => t.tier === tier).length,
      })),
      onChange: (v) => {
        setTiers(v)
        setPage(1)
      },
    },
    {
      id: 'region',
      label: 'Region',
      type: 'string',
      value: region,
      placeholder: 'Any region',
      onChange: (v) => {
        setRegion(v)
        setPage(1)
      },
    },
    {
      id: 'seated',
      label: 'Has active seats',
      type: 'boolean',
      hint: 'Hide tenants with nobody signed in',
      value: seatedOnly,
      onChange: (v) => {
        setSeatedOnly(v)
        setPage(1)
      },
    },
    {
      id: 'created',
      label: 'Created',
      type: 'dateRange',
      value: createdRange,
      onChange: (v) => {
        setCreatedRange(v)
        setPage(1)
      },
    },
  ]

  const columns: Column<Tenant>[] = [
    {
      id: 'name',
      header: 'Name',
      sortKey: 'name',
      width: '24%',
      cell: (t) => (
        <span className="flex items-center gap-2.5">
          <span className="inline-grid size-7 shrink-0 place-items-center rounded-full bg-chip text-[10.5px] font-extrabold text-chip-fg">
            {t.initials}
          </span>
          <span className="truncate font-bold text-ink-strong">{t.name}</span>
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortKey: 'status',
      width: '12%',
      cell: (t) => <Pill tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Pill>,
    },
    {
      id: 'contact',
      header: 'Primary contact',
      sortKey: 'contact',
      width: '17%',
      hideBelow: 'lg',
      cell: (t) => <span className="truncate">{t.contact}</span>,
    },
    {
      id: 'email',
      header: 'Email',
      sortKey: 'email',
      width: '20%',
      hideBelow: 'xl',
      cell: (t) => <span className="block truncate text-ink-soft">{t.email}</span>,
    },
    {
      id: 'created',
      header: 'Created',
      sortKey: 'created',
      width: '13%',
      hideBelow: 'md',
      cell: (t) => <span className="whitespace-nowrap text-ink-soft">{fmtDate(t.created)}</span>,
    },
  ]

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 max-sm:px-3">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-extrabold tracking-tight text-ink-strong">Tenants</h1>
            <p className="text-[12.5px] text-ink-soft tabular-nums">
              {sorted.length.toLocaleString()} match{sorted.length === 1 ? '' : 'es'} · sort{' '}
              <code className="rounded bg-code px-1 py-0.5 text-[11.5px]">{formatSort(sort)}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setLoading((v) => !v)}>
              {loading ? 'Show rows' : 'Show loading'}
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <div ref={anchorRef} className="relative flex items-center gap-2.5">
          <Button
            variant={open ? 'primary' : 'secondary'}
            size="lg"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            icon={<FunnelIcon width={15} height={15} />}
          >
            Filters
            {activeFilters > 0 && (
              <span className="ml-1 inline-grid min-w-[18px] place-items-center rounded-full bg-on-brand-solid/20 px-1.5 text-[11px] font-extrabold tabular-nums">
                {activeFilters}
              </span>
            )}
          </Button>

          <Omnibox
            label="Search and filter tenants"
            className="grow"
            placeholder="Search, or type to narrow to a field…"
            value={draft}
            onValueChange={setDraft}
            suffix={
              <kbd className="shrink-0 rounded border border-line bg-canvas px-1.5 py-0.5 text-[11px] font-bold text-ink-soft">
                ⌘K
              </kbd>
            }
            onRemoveLast={() => {
              if (fieldFilters.length > 0) return setFieldFilters((f) => f.slice(0, -1))
              if (search) return setSearch('')
              if (tiers.length > 0) return setTiers((t) => t.slice(0, -1))
              if (statuses.length > 0) return setStatuses((st) => st.slice(0, -1))
            }}
            chips={[
              ...(search
                ? [
                    {
                      id: 'search',
                      prefix: 'search:',
                      label: search,
                      onRemove: () => setSearch(''),
                    },
                  ]
                : []),
              ...fieldFilters.map((f) => ({
                id: f.id,
                prefix: `${FIELDS.find((x) => x.key === f.field)!.label.toLowerCase()}:`,
                label: f.value,
                onRemove: () => setFieldFilters((list) => list.filter((x) => x.id !== f.id)),
              })),
              ...statuses.map((st) => ({
                id: `status-${st}`,
                prefix: 'status:',
                label: STATUS_LABEL[st],
                onRemove: () => toggle(statuses, st, setStatuses),
              })),
              ...tiers.map((tier) => ({
                id: `tier-${tier}`,
                prefix: 'tier:',
                label: tier,
                onRemove: () => toggle(tiers, tier, setTiers),
              })),
            ]}
            groups={
              draft.trim()
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
                              Search for{' '}
                              <strong className="font-extrabold">“{draft.trim()}”</strong>
                            </>
                          ),
                          hint: `?search=${draft.trim()}`,
                          onSelect: () => {
                            setSearch(draft.trim())
                            setDraft('')
                            setPage(1)
                          },
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
                            {f.label} contains{' '}
                            <strong className="font-extrabold">{draft.trim()}</strong>
                          </>
                        ),
                        hint: f.param,
                        onSelect: () => {
                          setFieldFilters((list) => [
                            ...list,
                            { id: `${f.key}-${Date.now()}`, field: f.key, value: draft.trim() },
                          ])
                          setDraft('')
                          setPage(1)
                        },
                      })),
                    },
                  ]
                : []
            }
          />

          {open && !pinned && (
            <div className="absolute top-[calc(100%+8px)] left-0 z-30 w-[19rem] max-w-[calc(100vw-2rem)]">
              <FilterPanel
                fields={filterFields}
                activeCount={activeFilters}
                onReset={resetRail}
                pinned={false}
                onPinnedChange={setPinned}
                onClose={() => setOpen(false)}
                className="shadow-[0_12px_32px_var(--shadow-raised)]"
              />
            </div>
          )}
        </div>

        <div className="flex items-start gap-4 max-lg:flex-col max-lg:items-stretch">
          {open && pinned && (
            <FilterPanel
              fields={filterFields}
              activeCount={activeFilters}
              onReset={resetRail}
              pinned
              onPinnedChange={(v) => setPinned(v)}
              className="w-56 shrink-0 max-lg:w-full"
            />
          )}

          <DataTable
            className="w-full min-w-0 grow"
            caption="Tenants, with filters, sorting and pagination"
            columns={columns}
            rows={pageRows}
            rowId={(t) => t.id}
            loading={loading}
            skeletonRows={size}
            sort={sort}
            onSortChange={(s) => {
              setSort(s)
              setPage(1)
            }}
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
            expandedIds={expanded}
            onExpandedChange={setExpanded}
            renderExpanded={(t) => (
              <div className="grid grid-cols-4 gap-x-6 gap-y-4 max-md:grid-cols-2">
                <Detail label="Tenant ID">
                  <span className="font-bold tabular-nums">{t.id}</span>
                </Detail>
                <Detail label="Plan tier">
                  <span className="font-bold">{t.tier}</span>
                </Detail>
                <Detail label="Seats in use">
                  <span className="font-bold tabular-nums">
                    {t.seats[0]} of {t.seats[1]}
                  </span>
                </Detail>
                <Detail label="Renewal">
                  <span className="font-bold">{fmtDate(t.renewal)}</span>
                </Detail>
                <Detail label="Email">{t.email}</Detail>
                <Detail label="Phone">
                  <span className="tabular-nums">{t.phone}</span>
                </Detail>
                <Detail label="Region">{t.region}</Detail>
                <div className="flex items-end">
                  <a href={`#${t.id}`} className="text-[13px] font-bold text-brand-fg">
                    Open full record →
                  </a>
                </div>
              </div>
            )}
            rowActions={(t) => (
              <>
                <IconButton size="sm" shape="rounded" aria-label={`Edit ${t.name}`} title="Edit">
                  <PencilIcon width={14} height={14} />
                </IconButton>
                <IconButton
                  size="sm"
                  shape="rounded"
                  aria-label={`Delete ${t.name}`}
                  title="Delete"
                >
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
            labels={{
              emptyTitle: 'No tenants match',
              emptyBody: (
                <>
                  <span className="text-[13px] text-ink-soft">
                    {search && <strong className="font-bold text-ink">“{search}”</strong>}
                    {search && activeFilters > 1 && ' · '}
                    {activeFilters > 0 &&
                      `${activeFilters} filter${activeFilters === 1 ? '' : 's'}`}
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSearch('')
                        setDraft('')
                        setFieldFilters([])
                        setStatuses([])
                        setTiers([])
                      }}
                    >
                      Clear all filters
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setStatuses([])
                        setTiers([])
                      }}
                    >
                      Keep search, drop filters
                    </Button>
                  </div>
                </>
              ),
            }}
            footer={
              <Pagination
                page={safePage}
                size={size}
                totalElements={sorted.length}
                totalPages={totalPages}
                busy={loading}
                onPageChange={setPage}
                onSizeChange={(n) => {
                  setSize(n)
                  setPage(1)
                }}
                sizeOptions={[5, 10, 25]}
              />
            }
          />
        </div>
      </div>
    </div>
  )
}
