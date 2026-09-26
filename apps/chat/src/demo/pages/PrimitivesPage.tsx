// Unlisted on purpose: /primitives is not linked from the landing page. It is
// a workbench for packages/ui/src/core — every primitive in every state on one screen,
// so a change to a token or a size can be eyeballed in both themes at once.
//
// Wired into main.tsx under DemoFrame, so the back-to-demos bookmark still
// works even though nothing links here.
import { useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  CodeEditor,
  CopyButton,
  DiffViewer,
  formatCode,
  lintCode,
  Pagination,
  Select,
  Pill,
  TextInput,
  djangoPageAdapter,
  formatSort,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  ThemeToggle,
} from '@chat/ui'
import type { CodeLanguage, DiffEditable } from '@chat/ui'
import { codeSamples, diffSample } from '../mocks/codeSamples'

/** One titled block. `note` is the design rule the block is evidence for. */
function Section({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[15px] font-extrabold text-ink-strong">{title}</h2>
        {note && <p className="max-w-[70ch] text-[12.5px] leading-relaxed text-ink-soft">{note}</p>}
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-panel-solid p-5">
        {children}
      </div>
    </section>
  )
}

/** A labelled row of specimens. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line py-2.5 last:border-b-0 last:pb-0 first:pt-0">
      <span className="w-28 shrink-0 text-[11px] font-extrabold tracking-[0.07em] text-ink-soft uppercase">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2.5">{children}</div>
    </div>
  )
}

const TOTAL_ROWS = 1284

export function PrimitivesPage() {
  // Checkbox — real state, so `indeterminate` is demonstrable rather than a
  // static screenshot of itself.
  const [picked, setPicked] = useState<string[]>(['active'])
  const all = ['active', 'pending', 'suspended']
  const allOn = picked.length === all.length
  const some = picked.length > 0 && !allOn

  const [query, setQuery] = useState('crestview')

  // CodeEditor — one document per language, so switching and back keeps edits.
  const [lang, setLang] = useState<CodeLanguage>('json')
  const [docs, setDocs] = useState(() => ({
    json: codeSamples.json.text,
    yaml: codeSamples.yaml.text,
    text: codeSamples.text.text,
  }))
  const doc = docs[lang]
  const setDoc = (next: string) => setDocs((d) => ({ ...d, [lang]: next }))

  // DiffViewer — both sides live, so every `editable` combination can be typed into.
  const [diffEditable, setDiffEditable] = useState<DiffEditable>('none')
  const [diffOriginal, setDiffOriginal] = useState(diffSample.original)
  const [diffModified, setDiffModified] = useState(diffSample.modified)
  const diffEdited = diffOriginal !== diffSample.original || diffModified !== diffSample.modified
  const [diffCopied, setDiffCopied] = useState<string | null>(null)

  // Pagination — live, and the envelope below is rebuilt from this state, so
  // the adapter readout is proof rather than illustration.
  const [page, setPage] = useState(5)
  const [size, setSize] = useState(10)
  const totalPages = Math.max(1, Math.ceil(TOTAL_ROWS / size))

  const envelope = useMemo(
    () => ({
      success: true,
      timestamp: '2026-09-23T10:00:00Z',
      data: {
        content: [] as unknown[],
        first: page <= 1,
        last: page >= totalPages,
        page: {
          elements: Math.min(size, Math.max(0, TOTAL_ROWS - (page - 1) * size)),
          number: page - 1, // 0-based on the wire
          offset: (page - 1) * size + 1, // 1-based on the wire
          size,
        },
        total: { elements: TOTAL_ROWS, pages: totalPages },
        sort: [{ field: 'name', direction: 'asc' }],
      },
      message: 'Data retrieved successfully.',
      status: 200,
    }),
    [page, size, totalPages],
  )

  const normalized = useMemo(() => djangoPageAdapter<unknown>(envelope), [envelope])

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10 max-sm:px-4">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink-strong">
              Core primitives
            </h1>
            <p className="text-[13px] text-ink-soft">
              <code className="rounded bg-code px-1.5 py-0.5 text-[12px]">
                packages/ui/src/core
              </code>{' '}
              — the brand-agnostic set the DataTable will be built on. Unlisted route.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Section
          title="Button"
          note="Heights, not padding — 32 / 36 / 44, matching IconButton's boxes exactly so the two sit on one row without a half-pixel step. `primary` uses --brand-solid, never --action: that token is the composer's send button and nothing else."
        >
          <Row label="Variants">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </Row>
          <Row label="Sizes">
            <Button size="sm">Small 32</Button>
            <Button size="md">Medium 36</Button>
            <Button size="lg">Large 44</Button>
          </Row>
          <Row label="With icons">
            <Button variant="primary" icon={<PlusIcon width={13} height={13} />}>
              New tenant
            </Button>
            <Button icon={<PencilIcon width={13} height={13} />}>Edit</Button>
            <Button variant="danger" icon={<TrashIcon width={13} height={13} />}>
              Delete
            </Button>
          </Row>
          <Row label="Disabled">
            <Button variant="primary" disabled>
              Primary
            </Button>
            <Button disabled>Secondary</Button>
            <Button variant="ghost" disabled>
              Ghost
            </Button>
          </Row>
        </Section>

        <Section
          title="Checkbox"
          note="Native, tinted with accent-color. `indeterminate` is a DOM property React never writes from JSX, so the callback ref that sets it is load-bearing — tick one box below and the header goes mixed."
        >
          <Row label="Header box">
            <Checkbox
              label="Select all"
              checked={allOn}
              indeterminate={some}
              onChange={() => setPicked(allOn ? [] : all)}
            />
          </Row>
          <Row label="With counts">
            <div className="flex w-64 flex-col gap-1.5">
              <Checkbox
                label="Active"
                meta="1,109"
                checked={picked.includes('active')}
                onChange={(e) =>
                  setPicked((p) =>
                    e.target.checked ? [...p, 'active'] : p.filter((v) => v !== 'active'),
                  )
                }
              />
              <Checkbox
                label="Pending"
                meta="142"
                checked={picked.includes('pending')}
                onChange={(e) =>
                  setPicked((p) =>
                    e.target.checked ? [...p, 'pending'] : p.filter((v) => v !== 'pending'),
                  )
                }
              />
              <Checkbox
                label="Suspended"
                meta="33"
                checked={picked.includes('suspended')}
                onChange={(e) =>
                  setPicked((p) =>
                    e.target.checked ? [...p, 'suspended'] : p.filter((v) => v !== 'suspended'),
                  )
                }
              />
            </div>
          </Row>
          <Row label="States">
            <Checkbox label="Unchecked" checked={false} onChange={() => {}} />
            <Checkbox label="Checked" checked readOnly />
            <Checkbox label="Mixed" indeterminate readOnly />
            <Checkbox label="Disabled" disabled />
          </Row>
        </Section>

        <Section
          title="Select"
          note="A real <select> with the platform arrow replaced. The popup stays the one the OS already made keyboard-, touch- and screen-reader-correct. `label` is required — a bare select in a footer reads as “10” with no hint of what it sizes."
        >
          <Row label="Sizes">
            <Select
              label="Rows per page"
              showLabel
              selectSize="sm"
              defaultValue={25}
              options={[10, 25, 50, 100].map((n) => ({ value: n, label: String(n) }))}
            />
            <Select
              label="Status filter"
              selectSize="md"
              defaultValue="active"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'pending', label: 'Pending' },
                { value: 'suspended', label: 'Suspended' },
              ]}
            />
          </Row>
          <Row label="Disabled">
            <Select label="Region" disabled options={[{ value: 'ne', label: 'Northeast' }]} />
          </Row>
        </Section>

        <Section
          title="TextInput"
          note="The shell carries the border and the focus ring; the input is transparent. That is what lets prefix chips, the clear button and a ⌘K hint sit inside one outline — the omnibox needs it, so it belongs in the primitive."
        >
          <Row label="Basic">
            <TextInput
              label="Tenant name"
              showLabel
              placeholder="Any name"
              className="w-56"
              defaultValue=""
            />
          </Row>
          <Row label="Search">
            <TextInput
              label="Search tenants"
              placeholder="Search all fields…"
              icon={<SearchIcon width={15} height={15} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery('')}
              className="w-72"
            />
          </Row>
          <Row label="Omnibox">
            <TextInput
              label="Search and filter"
              inputSize="lg"
              placeholder="Search, or type a field name…"
              icon={<SearchIcon width={16} height={16} />}
              className="w-[30rem] max-w-full"
              prefix={
                <span className="flex shrink-0 items-center gap-1.5">
                  <Pill tone="brand">status: Active</Pill>
                  <Pill tone="brand">tier: Enterprise</Pill>
                </span>
              }
              suffix={
                <kbd className="shrink-0 rounded border border-line bg-canvas px-1.5 py-0.5 text-[11px] font-bold text-ink-soft">
                  ⌘K
                </kbd>
              }
            />
          </Row>
        </Section>

        <Section
          title="Pill"
          note="Named for the shape, not the first use case — the same label carries a plan tier or a region, not just a status. `neutral` is built from --ink-soft rather than --tint (which is --brand-600, so it came out faintly blue). No green: brand.css has no green ramp, and one would be the first colour in the library that ignores a chat-theme-* switch."
        >
          <Row label="Soft">
            <Pill tone="brand">Active</Pill>
            <Pill tone="neutral">Draft</Pill>
            <Pill tone="caution">Pending</Pill>
            <Pill tone="danger">Suspended</Pill>
          </Row>
          <Row label="Outline">
            <Pill variant="outline" tone="brand">
              Active
            </Pill>
            <Pill variant="outline" tone="neutral">
              Draft
            </Pill>
            <Pill variant="outline" tone="caution">
              Pending
            </Pill>
            <Pill variant="outline" tone="danger">
              Suspended
            </Pill>
          </Row>
          <Row label="On a tint">
            <div className="flex flex-wrap items-center gap-2.5 rounded-lg bg-chip px-3 py-2">
              <Pill tone="brand">Soft on tint</Pill>
              <Pill variant="outline" tone="brand">
                Outline on tint
              </Pill>
            </div>
          </Row>
          <Row label="With dot">
            <Pill tone="brand" dot>
              Active
            </Pill>
            <Pill tone="neutral" dot>
              Draft
            </Pill>
            <Pill tone="caution" dot>
              Pending
            </Pill>
            <Pill tone="danger" dot>
              Suspended
            </Pill>
          </Row>
        </Section>

        <Section
          title="Pagination"
          note="Live — page and size below drive the envelope in the next section. The rail's length is stable so Next does not move under the pointer, and a gap is only ever drawn in place of more than one hidden page."
        >
          <div className="overflow-hidden rounded-lg border border-line">
            <Pagination
              page={page}
              size={size}
              totalElements={TOTAL_ROWS}
              totalPages={totalPages}
              onPageChange={setPage}
              onSizeChange={(n) => {
                setSize(n)
                setPage(1)
              }}
            />
          </div>
          <Row label="Compact">
            <div className="w-full overflow-hidden rounded-lg border border-line">
              <Pagination
                compact
                page={page}
                size={size}
                totalElements={TOTAL_ROWS}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </Row>
          <Row label="Busy">
            <div className="w-full overflow-hidden rounded-lg border border-line">
              <Pagination
                busy
                page={page}
                size={size}
                totalElements={TOTAL_ROWS}
                totalPages={totalPages}
                onPageChange={setPage}
                onSizeChange={setSize}
              />
            </div>
          </Row>
        </Section>

        <Section
          title="Paging adapter"
          note="The Django envelope carries three page conventions in one round trip: the request is 1-based, page.number is 0-based, page.offset is 1-based. The adapter is the only place that is resolved — no component ever writes page − 1."
        >
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-extrabold tracking-[0.07em] text-ink-soft uppercase">
                Wire — data.page
              </span>
              <pre className="overflow-x-auto rounded-lg bg-code-block p-3 text-[12px] leading-relaxed text-ink">
                {JSON.stringify(envelope.data.page, null, 2)}
              </pre>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-extrabold tracking-[0.07em] text-ink-soft uppercase">
                Normalized — Page
              </span>
              <pre className="overflow-x-auto rounded-lg bg-code-block p-3 text-[12px] leading-relaxed text-ink">
                {JSON.stringify(
                  {
                    page: normalized.page,
                    size: normalized.size,
                    elements: normalized.elements,
                    offset: normalized.offset,
                    first: normalized.first,
                    last: normalized.last,
                    totalElements: normalized.totalElements,
                    totalPages: normalized.totalPages,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
          <Row label="Derived">
            <span className="text-[13px] text-ink">
              Readout{' '}
              <strong className="font-extrabold text-ink-strong tabular-nums">
                {normalized.offset.toLocaleString()}–
                {(normalized.offset + normalized.elements - 1).toLocaleString()} of{' '}
                {normalized.totalElements.toLocaleString()}
              </strong>
            </span>
            <span className="text-[13px] text-ink">
              Sort{' '}
              <code className="rounded bg-code px-1.5 py-0.5 text-[12px]">
                {formatSort(normalized.sort)}
              </code>
            </span>
          </Row>
        </Section>

        <Section
          title="CodeEditor"
          note="A transparent <textarea> over a highlighted copy of the same text — typing, selection, undo and screen readers are the browser's. Tab indents (Shift+Tab outdents, multi-line too), Enter keeps the indent, Escape then Tab leaves the field. JSON is checked with JSON.parse; break a comma to see the diagnostic."
        >
          <CodeEditor
            label="Code"
            language={lang}
            value={doc}
            onChange={setDoc}
            className="h-[26rem]"
            title={
              <>
                <span className="truncate">{codeSamples[lang].file}</span>
                {doc !== codeSamples[lang].text && (
                  <span className="shrink-0 text-[12px] font-normal text-ink-soft">· Edited</span>
                )}
              </>
            }
            actions={
              <>
                <Select
                  label="Language"
                  selectSize="sm"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as CodeLanguage)}
                  options={[
                    { value: 'json', label: 'JSON' },
                    { value: 'yaml', label: 'YAML' },
                    { value: 'text', label: 'Plain text' },
                  ]}
                />
                {lang === 'json' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={lintCode('json', doc) !== null}
                    onClick={() => setDoc(formatCode('json', doc))}
                  >
                    Format
                  </Button>
                )}
                <CopyButton text={doc} size="sm" />
              </>
            }
          />
          <span className="pt-2 text-[11px] font-extrabold tracking-[0.07em] text-ink-soft uppercase">
            Read only, no status bar
          </span>
          <CodeEditor
            label="persona.json, read only"
            language="json"
            value={codeSamples.json.text.split('\n').slice(0, 7).join('\n')}
            statusBar={false}
          />
        </Section>

        <Section
          title="DiffViewer"
          note="Myers' diff by line, then again by word inside each changed pair, so the edit itself gets the stronger wash. Added is the accent and removed is --danger rather than green — brand.css has no green ramp, and the +/− column carries the meaning without colour. Long lines wrap, so the two sides of a row can't drift apart. Make a side editable and it becomes a textarea editor — no wrapping, synced scrolling, the diff redrawn on every keystroke."
        >
          <Row label="Editable">
            <Select
              label="Editable sides"
              selectSize="sm"
              value={diffEditable}
              onChange={(e) => setDiffEditable(e.target.value as DiffEditable)}
              options={[
                { value: 'none', label: 'None — read only' },
                { value: 'original', label: 'Original only' },
                { value: 'modified', label: 'Modified only' },
                { value: 'both', label: 'Both sides' },
              ]}
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={!diffEdited}
              onClick={() => {
                setDiffOriginal(diffSample.original)
                setDiffModified(diffSample.modified)
              }}
            >
              Reset text
            </Button>
            {diffCopied && (
              <span className="text-[12.5px] text-ink-soft" aria-live="polite">
                {diffCopied}
              </span>
            )}
          </Row>
          <DiffViewer
            title={diffSample.file}
            language="yaml"
            original={diffOriginal}
            modified={diffModified}
            editable={diffEditable}
            onOriginalChange={setDiffOriginal}
            onModifiedChange={setDiffModified}
            onCopyOriginal={(v) => setDiffCopied(`Copied original — ${v.split('\n').length} lines`)}
            onCopyModified={(v) => setDiffCopied(`Copied modified — ${v.split('\n').length} lines`)}
            className="h-[30rem]"
          />
        </Section>

        <footer className="pb-4 text-[12px] text-ink-soft">
          Next:{' '}
          <code className="rounded bg-code px-1.5 py-0.5">packages/ui/src/core/data-table</code> —
          sortable header, row-click expansion, selection and bulk bar.
        </footer>
      </div>
    </div>
  )
}
