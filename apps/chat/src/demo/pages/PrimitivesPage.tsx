// Unlisted on purpose: /primitives is not linked from the landing page. It is
// a workbench for packages/ui/src/core — every primitive in every state on one screen,
// so a change to a token or a size can be eyeballed in both themes at once.
//
// Wired into main.tsx under DemoFrame, so the back-to-demos bookmark still
// works even though nothing links here.
import { useMemo, useRef, useState } from 'react'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Breadcrumbs,
  Alert,
  AdaptiveButton,
  Avatar,
  Button,
  Checkbox,
  ChoiceCard,
  CodeEditor,
  CopyButton,
  DiffViewer,
  formatCode,
  lintCode,
  Modal,
  Pagination,
  Select,
  Slider,
  Pill,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  RadioGroup,
  RadioGroupItem,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Textarea,
  TextInput,
  djangoPageAdapter,
  formatSort,
  FormatIcon,
  HomeIcon,
  LibraryIcon,
  PencilIcon,
  PlanIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  SparkleIcon,
  TrashIcon,
  UserIcon,
  ThemeToggle,
} from '@chat/ui'
import type { CodeEditorHandle, CodeLanguage, DiffEditable } from '@chat/ui'
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
      <div className="flex flex-col gap-3 rounded-surface border border-line bg-panel-solid p-5">
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
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">{children}</div>
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
  const [cardPlan, setCardPlan] = useState('home-equity')
  const [cardFeatures, setCardFeatures] = useState<string[]>(['citations'])

  const [query, setQuery] = useState('crestview')
  const [budget, setBudget] = useState(45)
  const [plan, setPlan] = useState('team')
  const [visiblePills, setVisiblePills] = useState(
    () => new Set(['green', 'orange', 'yellow', 'red']),
  )
  const [actionPillActive, setActionPillActive] = useState(false)
  const [avatarSelected, setAvatarSelected] = useState(false)
  const [iconTab, setIconTab] = useState<string | null>('account')
  const [infoAlertVisible, setInfoAlertVisible] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [openModal, setOpenModal] = useState<'delete' | 'workspace' | null>(null)
  const [adaptiveFormatted, setAdaptiveFormatted] = useState(false)
  const [adaptiveCompact, setAdaptiveCompact] = useState(false)
  const workspaceNameRef = useRef<HTMLInputElement>(null)

  // CodeEditor — one document per language, so switching and back keeps edits.
  const [lang, setLang] = useState<CodeLanguage>('json')
  const [docs, setDocs] = useState(() => ({
    json: codeSamples.json.text,
    yaml: codeSamples.yaml.text,
    csv: codeSamples.csv.text,
    html: codeSamples.html.text,
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

  const wizardEditor = useRef<CodeEditorHandle>(null)
  const [wizardCode, setWizardCode] = useState('{\n  "enabled": true,\n}')
  const [wizardStep, setWizardStep] = useState(1)
  const [wizardError, setWizardError] = useState<string | null>(null)

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
          note="Heights, not padding — 32 / 36 / 44, matching IconButton's boxes exactly. AdaptiveButton keeps one native button but collapses its visible label inside a constrained query container; its accessible name remains and its tooltip is portalled beyond clipping and local stacking contexts."
        >
          <Row label="Variants">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="destructive">Destructive</Button>
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
          <Row label="Adaptive">
            <div className="flex w-full min-w-0 flex-col items-start gap-2">
              <Button
                size="sm"
                variant="ghost"
                aria-pressed={adaptiveCompact}
                onClick={() => setAdaptiveCompact((value) => !value)}
              >
                {adaptiveCompact ? 'Show roomy preview' : 'Preview compact fallback'}
              </Button>
              <div
                className={`@container flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-control border border-line bg-tint/3 p-2 transition-[max-width] ${
                  adaptiveCompact ? 'max-w-72' : 'max-w-xl'
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-[12px] text-ink-soft">
                  Diff toolbar action
                </span>
                <AdaptiveButton
                  size="sm"
                  variant="ghost"
                  icon={<FormatIcon width={16} height={16} />}
                  label={adaptiveFormatted ? 'Raw view' : 'Format view'}
                  tooltip={adaptiveFormatted ? 'Show raw comparison' : 'Format comparison view'}
                  aria-pressed={adaptiveFormatted}
                  onClick={() => setAdaptiveFormatted((value) => !value)}
                />
              </div>
            </div>
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
          title="Modal"
          note="A controlled native dialog supplies real modality, focus containment, Escape dismissal and trigger-focus restoration. The opaque branded surface scrolls independently, while callers compose actions from Button."
        >
          <Row label="Examples">
            <Button
              variant="danger"
              icon={<TrashIcon width={13} height={13} />}
              onClick={() => setOpenModal('delete')}
            >
              Delete tenant
            </Button>
            <Button
              variant="primary"
              icon={<PlusIcon width={13} height={13} />}
              onClick={() => setOpenModal('workspace')}
            >
              Create workspace
            </Button>

            <Modal
              open={openModal === 'delete'}
              onOpenChange={(open) => !open && setOpenModal(null)}
              size="sm"
              title="Delete Crestview Health?"
              description="This permanently removes the tenant and its workspace data. This action cannot be undone."
              icon={<TrashIcon />}
              iconTone="danger"
              showCloseButton={false}
              footer={
                <>
                  <Button autoFocus onClick={() => setOpenModal(null)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={() => setOpenModal(null)}>
                    Delete tenant
                  </Button>
                </>
              }
            >
              <div className="rounded-surface border border-line bg-tint/4 px-3.5 py-3">
                <p className="font-bold text-ink-strong">Crestview Health</p>
                <p className="mt-0.5 text-xs text-ink-soft">42 members · Enterprise plan</p>
              </div>
            </Modal>

            <Modal
              open={openModal === 'workspace'}
              onOpenChange={(open) => !open && setOpenModal(null)}
              title="Create workspace"
              description="Set the name and region now. You can invite members after creation."
              icon={<PlusIcon />}
              initialFocusRef={workspaceNameRef}
              expandable
              footer={
                <>
                  <Button onClick={() => setOpenModal(null)}>Cancel</Button>
                  <Button variant="primary" onClick={() => setOpenModal(null)}>
                    Create workspace
                  </Button>
                </>
              }
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="modal-workspace-name">Workspace name</FieldLabel>
                  <TextInput
                    ref={workspaceNameRef}
                    id="modal-workspace-name"
                    placeholder="Claims operations"
                    className="w-full"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="modal-workspace-region">Region</FieldLabel>
                  <Select
                    id="modal-workspace-region"
                    defaultValue="us-east"
                    className="w-full"
                    options={[
                      { value: 'us-east', label: 'US East' },
                      { value: 'us-west', label: 'US West' },
                      { value: 'eu-west', label: 'EU West' },
                    ]}
                  />
                </Field>
              </FieldGroup>
            </Modal>
          </Row>
        </Section>

        <Section
          title="Checkbox"
          note="A native input drives a custom rounded-square shell, preserving forms, keyboard behavior and screen-reader state while giving checked and mixed states the active brand fill. Tick one option below and the header goes mixed."
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
          title="ChoiceCard"
          note="A radio or checkbox with a larger visual surface. The native controlled input still owns form submission, required validation, keyboard behavior and screen-reader state."
        >
          <Row label="Radio">
            <fieldset className="grid w-full grid-cols-3 gap-3 max-md:grid-cols-1">
              <legend className="sr-only">Financing product</legend>
              <ChoiceCard
                type="radio"
                name="card-plan"
                value="home-equity"
                checked={cardPlan === 'home-equity'}
                onChange={(event) => setCardPlan(event.currentTarget.value)}
                label="Home equity"
                description="Use available home value"
                icon={<HomeIcon />}
              />
              <ChoiceCard
                type="radio"
                name="card-plan"
                value="line-of-credit"
                checked={cardPlan === 'line-of-credit'}
                onChange={(event) => setCardPlan(event.currentTarget.value)}
                label="Line of credit"
                description="Flexible access as needed"
                icon={<PlanIcon />}
              />
              <ChoiceCard
                type="radio"
                name="card-plan"
                value="refinance"
                checked={cardPlan === 'refinance'}
                onChange={(event) => setCardPlan(event.currentTarget.value)}
                label="Refinance"
                description="Currently unavailable"
                icon={<RefreshIcon />}
                disabled
              />
            </fieldset>
          </Row>
          <Row label="Checkbox">
            <fieldset className="grid w-full grid-cols-3 gap-3 max-md:grid-cols-1">
              <legend className="sr-only">Assistant features</legend>
              {[
                {
                  value: 'citations',
                  label: 'Citations',
                  description: 'Show supporting sources',
                  icon: <LibraryIcon />,
                },
                {
                  value: 'search',
                  label: 'Web search',
                  description: 'Find current information',
                  icon: <SearchIcon />,
                },
                {
                  value: 'starters',
                  label: 'Prompt starters',
                  description: 'Offer suggested questions',
                  icon: <SparkleIcon />,
                },
              ].map((feature) => (
                <ChoiceCard
                  key={feature.value}
                  type="checkbox"
                  name="card-features"
                  value={feature.value}
                  checked={cardFeatures.includes(feature.value)}
                  onChange={(event) => {
                    const selected = event.currentTarget.checked
                    setCardFeatures((current) =>
                      selected
                        ? [...current, feature.value]
                        : current.filter((value) => value !== feature.value),
                    )
                  }}
                  label={feature.label}
                  description={feature.description}
                  icon={feature.icon}
                />
              ))}
            </fieldset>
          </Row>
        </Section>

        <Section
          title="Select"
          note="A label-agnostic native <select> with the platform arrow replaced. Pair it with FieldLabel in forms or provide an accessible name in compact toolbars."
        >
          <Row label="Sizes">
            <Field>
              <FieldLabel htmlFor="primitive-page-size">Rows per page</FieldLabel>
              <Select
                id="primitive-page-size"
                size="sm"
                defaultValue={25}
                options={[10, 25, 50, 100].map((n) => ({ value: n, label: String(n) }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="primitive-status-filter">Status</FieldLabel>
              <Select
                id="primitive-status-filter"
                size="md"
                defaultValue="active"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
              />
            </Field>
          </Row>
          <Row label="Disabled">
            <Select aria-label="Region" disabled options={[{ value: 'ne', label: 'Northeast' }]} />
          </Row>
        </Section>

        <Section
          title="TextInput"
          note="The shell carries the border and the focus ring; the input is transparent. That is what lets prefix chips, the clear button and a ⌘K hint sit inside one outline — the omnibox needs it, so it belongs in the primitive."
        >
          <Row label="Basic">
            <Field>
              <FieldLabel htmlFor="primitive-tenant">Tenant name</FieldLabel>
              <TextInput
                id="primitive-tenant"
                placeholder="Any name"
                className="w-56"
                defaultValue=""
              />
            </Field>
          </Row>
          <Row label="Valid">
            <Field>
              <FieldLabel htmlFor="primitive-valid-tenant">Tenant name</FieldLabel>
              <TextInput
                id="primitive-valid-tenant"
                className="w-56"
                defaultValue="Crestview"
                validationState="valid"
                validationMessage="Tenant name is available."
              />
            </Field>
          </Row>
          <Row label="Search">
            <TextInput
              aria-label="Search tenants"
              placeholder="Search all fields…"
              icon={<SearchIcon width={15} height={15} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery('')}
              clearLabel="Clear tenant search"
              className="w-72"
            />
          </Row>
          <Row label="Omnibox">
            <TextInput
              aria-label="Search and filter"
              size="lg"
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
          title="Alert"
          note="Inline status messaging built from the active brand tokens. Every tone pairs colour with a distinct glyph and visible title; the stronger leading border is optional, while lists and native details handle richer messages."
        >
          <Row label="States">
            <div className="flex w-[42rem] max-w-full flex-col gap-2.5">
              <Alert tone="success" title="Workspace settings saved">
                Your changes are available to everyone on the team.
              </Alert>
              <Alert tone="warning" title="Review before publishing">
                Two answers contain sources that are more than a year old.
              </Alert>
              <Alert tone="error" title="The import could not be completed">
                Correct the source data and try again.
              </Alert>
              <Alert tone="info" title="References are still loading">
                You can continue reading while the source documents are prepared.
              </Alert>
            </div>
          </Row>
          <Row label="With accent border">
            <div className="flex w-[42rem] max-w-full flex-col gap-2.5">
              <Alert tone="success" title="Workspace settings saved" bordered />
              <Alert tone="warning" title="Review before publishing" bordered />
              <Alert tone="error" title="The import could not be completed" bordered />
              <Alert tone="info" title="References are still loading" bordered />
            </div>
          </Row>
          <Row label="List">
            <Alert
              tone="error"
              title="Three fields need attention"
              className="w-[42rem] max-w-full"
              items={[
                'Workspace name is required.',
                'API endpoint must use HTTPS.',
                'At least one knowledge source must be selected.',
              ]}
            />
          </Row>
          <Row label="Action + details">
            <Alert
              tone="error"
              title="The API rejected this request"
              className="w-[42rem] max-w-full"
              action={{
                label: retryCount === 0 ? 'Retry' : `Retry (${retryCount})`,
                onClick: () => setRetryCount((count) => count + 1),
              }}
              detailsLabel="Show API response"
              details={
                <pre className="overflow-x-auto rounded-control border border-line bg-code-block p-3 font-mono text-[11.5px] leading-relaxed text-ink">
                  {JSON.stringify(
                    {
                      status: 422,
                      code: 'invalid_source',
                      requestId: 'req_7f91a2',
                    },
                    null,
                    2,
                  )}
                </pre>
              }
            >
              The service returned a validation error. Technical details are available below.
            </Alert>
          </Row>
          <Row label="Dismissible">
            {infoAlertVisible ? (
              <Alert
                tone="info"
                title="Citation shortcuts are available"
                className="w-[42rem] max-w-full"
                onDismiss={() => setInfoAlertVisible(false)}
                dismissLabel="Dismiss citation shortcut notice"
              >
                Select any numbered citation to open its original source.
              </Alert>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setInfoAlertVisible(true)}>
                Reset dismissed alert
              </Button>
            )}
          </Row>
        </Section>

        <Section
          title="Form composition"
          note="Controls stay atomic. Field owns the visible label, description and error relationship; every colour and state comes from the active brand tokens."
        >
          <form
            className="max-w-xl"
            onSubmit={(event) => {
              event.preventDefault()
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="form-project">Project name</FieldLabel>
                <TextInput
                  id="form-project"
                  name="project"
                  placeholder="Claims assistant"
                  aria-describedby="form-project-help"
                />
                <FieldDescription id="form-project-help">
                  Used in the workspace navigation and audit log.
                </FieldDescription>
              </Field>

              <Field data-invalid>
                <FieldLabel htmlFor="form-key">API key</FieldLabel>
                <TextInput
                  id="form-key"
                  name="apiKey"
                  defaultValue="invalid-key"
                  aria-invalid="true"
                  aria-describedby="form-key-error"
                />
                <FieldError id="form-key-error">Use a key beginning with sk-.</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="form-description">Instructions</FieldLabel>
                <Textarea
                  id="form-description"
                  name="description"
                  placeholder="Describe how this assistant should respond…"
                  aria-describedby="form-description-help"
                />
                <FieldDescription id="form-description-help">
                  Plain text, up to 500 characters.
                </FieldDescription>
              </Field>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <Field>
                  <FieldLabel htmlFor="form-region">Region</FieldLabel>
                  <Select
                    id="form-region"
                    name="region"
                    defaultValue="us-east"
                    options={[
                      { value: 'us-east', label: 'US East' },
                      { value: 'us-west', label: 'US West' },
                      { value: 'eu-west', label: 'EU West' },
                    ]}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="form-budget">Monthly budget</FieldLabel>
                  <Slider
                    id="form-budget"
                    name="budget"
                    min={10}
                    max={100}
                    step={5}
                    value={budget}
                    onValueChange={setBudget}
                    formatValue={(value) => `$${value}`}
                  />
                </Field>
              </div>

              <FieldSet>
                <FieldLegend>Plan</FieldLegend>
                <FieldDescription id="form-plan-help">
                  Choose the collaboration level for this workspace.
                </FieldDescription>
                <RadioGroup
                  name="plan"
                  value={plan}
                  onValueChange={setPlan}
                  aria-describedby="form-plan-help"
                >
                  {[
                    ['starter', 'Starter'],
                    ['team', 'Team'],
                    ['enterprise', 'Enterprise'],
                  ].map(([value, label]) => (
                    <div key={value} className="flex items-center gap-2.5">
                      <RadioGroupItem id={`form-plan-${value}`} value={value} />
                      <FieldLabel htmlFor={`form-plan-${value}`}>{label}</FieldLabel>
                    </div>
                  ))}
                </RadioGroup>
              </FieldSet>

              <Row label="States">
                <Textarea aria-label="Read-only notes" readOnly defaultValue="Read-only notes" />
                <Textarea aria-label="Disabled notes" disabled defaultValue="Disabled notes" />
                <Slider
                  aria-label="Disabled threshold"
                  disabled
                  defaultValue={30}
                  className="w-48"
                />
              </Row>

              <Row label="Invalid">
                <Textarea
                  aria-label="Invalid instructions"
                  aria-invalid="true"
                  rows={2}
                  defaultValue="Invalid instructions"
                  className="w-52"
                />
                <Select
                  aria-label="Invalid region"
                  aria-invalid="true"
                  defaultValue="unknown"
                  options={[{ value: 'unknown', label: 'Unknown region' }]}
                />
                <Slider
                  aria-label="Invalid threshold"
                  aria-invalid="true"
                  defaultValue={65}
                  className="w-48"
                />
                <RadioGroup name="invalid-choice" defaultValue="a" aria-label="Invalid choice">
                  <RadioGroupItem value="a" aria-label="Invalid option" aria-invalid="true" />
                </RadioGroup>
              </Row>

              <Button type="submit" variant="primary" className="self-start">
                Save settings
              </Button>
            </FieldGroup>
          </form>
        </Section>

        <Section
          title="Breadcrumbs"
          note="The location trail stays semantic and compact. Page actions are composed beside it rather than becoming part of the breadcrumb component."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Breadcrumbs>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="#"
                    className="font-bold text-brand-fg"
                    onClick={(event) => event.preventDefault()}
                  >
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="#" onClick={(event) => event.preventDefault()}>
                    Tenants
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="#" onClick={(event) => event.preventDefault()}>
                    Northeast portfolio
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Crestview Health</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumbs>
            <Button variant="primary">Add new tenant</Button>
          </div>
        </Section>

        <Section
          title="Avatar"
          note="A standalone identity primitive with explicit text, image, and icon content. Adding onClick promotes the same visual to a native button; static avatars remain non-interactive."
        >
          <Row label="Text">
            <Avatar variant="text" text="A" size="lg" tone="accent" />
            <Avatar variant="text" text="AN" size="lg" />
            <Avatar variant="text" text="A" size="sm" />
            <Avatar variant="text" text="AN" size="xs" tone="brand" />
            <Avatar variant="text" text="32" size={32} tone="soft" />
          </Row>
          <Row label="Image">
            <Avatar variant="image" src="/favicon.svg" alt="Aristotle" size="md" tone="brand" />
            <Avatar variant="image" src="/favicon.svg" alt="Aristotle" size="sm" />
          </Row>
          <Row label="Icon">
            <Avatar
              variant="icon"
              icon={<UserIcon />}
              label="Unassigned user"
              size="md"
              tone="brand"
            />
          </Row>
          <Row label="Clickable">
            <Avatar
              variant="text"
              text="CS"
              tone={avatarSelected ? 'brand' : 'accent'}
              aria-label="Open Christian's profile"
              aria-pressed={avatarSelected}
              onClick={() => setAvatarSelected((selected) => !selected)}
            />
            <Avatar
              variant="icon"
              icon={<UserIcon />}
              label="Open account menu"
              onClick={() => setAvatarSelected((selected) => !selected)}
            />
          </Row>
        </Section>

        <Section
          title="Pill"
          note="Named for the shape, not the first use case. Soft and outline treatments share a theme-aware colour set; avatars accept an image, initials, or icon; onClose adds a separately focusable dismiss button with an accessible name."
        >
          <Row label="Soft">
            <Pill tone="brand">Active</Pill>
            <Pill tone="neutral">Draft</Pill>
            <Pill tone="success">Verified</Pill>
            <Pill tone="warning">Pending</Pill>
            <Pill tone="danger">Suspended</Pill>
          </Row>
          <Row label="Outline">
            <Pill variant="outline" tone="brand">
              Active
            </Pill>
            <Pill variant="outline" tone="neutral">
              Draft
            </Pill>
            <Pill variant="outline" tone="success">
              Saved
            </Pill>
            <Pill variant="outline" tone="warning">
              Pending
            </Pill>
            <Pill variant="outline" tone="danger">
              Suspended
            </Pill>
          </Row>
          <Row label="Colours">
            <Pill tone="green">Green chip</Pill>
            <Pill tone="orange">Orange chip</Pill>
            <Pill tone="yellow">Yellow chip</Pill>
            <Pill tone="red">Red chip</Pill>
            <Pill variant="outline" tone="green">
              Green outline
            </Pill>
            <Pill variant="outline" tone="orange">
              Orange outline
            </Pill>
            <Pill variant="outline" tone="yellow">
              Yellow outline
            </Pill>
            <Pill variant="outline" tone="red">
              Red outline
            </Pill>
          </Row>
          <Row label="Avatar">
            <Pill tone="neutral" avatar={<Avatar variant="text" text="AN" size="xs" />}>
              Avatar chip
            </Pill>
            <Pill
              variant="outline"
              tone="brand"
              avatar={<Avatar variant="image" src="/favicon.svg" alt="" size="xs" />}
            >
              Bordered avatar
            </Pill>
          </Row>
          <Row label="Sizes">
            <Pill size="sm" tone="green">
              Small green chip
            </Pill>
            <Pill size="sm" variant="outline" tone="orange">
              Small outline chip
            </Pill>
            <Pill tone="yellow">Default pill</Pill>
          </Row>
          <Row label="Actionable">
            <Pill
              tone={actionPillActive ? 'brand' : 'neutral'}
              aria-pressed={actionPillActive}
              onClick={() => setActionPillActive((active) => !active)}
            >
              {actionPillActive ? 'Selected chip' : 'Clickable chip'}
            </Pill>
            <Pill
              variant="outline"
              tone="brand"
              onClick={() => setActionPillActive((active) => !active)}
            >
              Clickable outline
            </Pill>
          </Row>
          <Row label="With icon">
            <Pill tone="brand" leadingIcon={<UserIcon />}>
              Assigned to you
            </Pill>
            <Pill
              size="lg"
              variant="outline"
              tone="neutral"
              leadingIcon={<SearchIcon />}
              onClick={() => setActionPillActive((active) => !active)}
            >
              Search scope
            </Pill>
          </Row>
          <Row label="Closable">
            {(['green', 'orange', 'yellow', 'red'] as const).map((tone) =>
              visiblePills.has(tone) ? (
                <Pill
                  key={tone}
                  tone={tone}
                  onClose={() =>
                    setVisiblePills((current) => {
                      const next = new Set(current)
                      next.delete(tone)
                      return next
                    })
                  }
                >
                  {tone[0].toUpperCase() + tone.slice(1)} chip
                </Pill>
              ) : null,
            )}
            {visiblePills.size === 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setVisiblePills(new Set(['green', 'orange', 'yellow', 'red']))}
              >
                Reset pills
              </Button>
            )}
          </Row>
          <Row label="On a tint">
            <div className="flex flex-wrap items-center gap-2.5 rounded-control bg-chip px-3 py-2">
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
            <Pill tone="success" dot>
              Verified
            </Pill>
            <Pill tone="warning" dot>
              Pending
            </Pill>
            <Pill tone="danger" dot>
              Suspended
            </Pill>
          </Row>
        </Section>

        <Section
          title="Tabs"
          note="The familiar shadcn compound API, styled with this app's brand tokens. Arrow keys move through enabled tabs; selection may activate automatically or wait for Enter/Space in manual mode."
        >
          <Tabs defaultValue="elements">
            <TabsList>
              <TabsTrigger value="elements">Card elements</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="disabled" disabled>
                Disabled
              </TabsTrigger>
            </TabsList>
            <TabsContent value="elements">
              <div className="rounded-control border border-line bg-code p-4 text-[13px] text-ink">
                Content for the selected card-elements tab.
              </div>
            </TabsContent>
            <TabsContent value="details">
              <div className="rounded-control border border-line bg-code p-4 text-[13px] text-ink">
                Details stay mounted only while this tab is selected.
              </div>
            </TabsContent>
            <TabsContent value="activity">
              <div className="rounded-control border border-line bg-code p-4 text-[13px] text-ink">
                Recent activity for this record.
              </div>
            </TabsContent>
          </Tabs>
          <Row label="Contained">
            <Tabs defaultValue="overview">
              <TabsList variant="contained">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="text-[13px] text-ink-soft">
                Overview panel
              </TabsContent>
              <TabsContent value="analytics" className="text-[13px] text-ink-soft">
                Analytics panel
              </TabsContent>
              <TabsContent value="reports" className="text-[13px] text-ink-soft">
                Reports panel
              </TabsContent>
            </Tabs>
          </Row>
          <Row label="Icon rail">
            <Tabs
              value={iconTab}
              onValueChange={setIconTab}
              allowDeselect
              orientation="vertical"
              activationMode="manual"
            >
              <TabsList variant="unstyled" className="flex flex-col gap-1">
                <TabsTrigger
                  value="account"
                  controls={false}
                  tabIndex={iconTab == null ? 0 : undefined}
                  aria-label="Account"
                  className={`grid size-8 place-items-center rounded-control transition ${
                    iconTab === 'account' ? 'bg-chip text-chip-fg' : 'text-ink-soft hover:bg-tint/8'
                  }`}
                >
                  <UserIcon width={16} height={16} />
                </TabsTrigger>
                <TabsTrigger
                  value="search"
                  controls={false}
                  aria-label="Search"
                  className={`grid size-8 place-items-center rounded-control transition ${
                    iconTab === 'search' ? 'bg-chip text-chip-fg' : 'text-ink-soft hover:bg-tint/8'
                  }`}
                >
                  <SearchIcon width={16} height={16} />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </Row>
        </Section>

        <Section
          title="Pagination"
          note="Live — page and size below drive the envelope in the next section. The rail's length is stable so Next does not move under the pointer, and a gap is only ever drawn in place of more than one hidden page."
        >
          <div className="overflow-hidden rounded-control border border-line">
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
            <div className="w-full overflow-hidden rounded-control border border-line">
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
            <div className="w-full overflow-hidden rounded-control border border-line">
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
              <pre className="overflow-x-auto rounded-control bg-code-block p-3 text-[12px] leading-relaxed text-ink">
                {JSON.stringify(envelope.data.page, null, 2)}
              </pre>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-extrabold tracking-[0.07em] text-ink-soft uppercase">
                Normalized — Page
              </span>
              <pre className="overflow-x-auto rounded-control bg-code-block p-3 text-[12px] leading-relaxed text-ink">
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
          note="A transparent <textarea> over a highlighted copy of the same text — typing, selection, undo and screen readers are the browser's. JSON, YAML, CSV and HTML have syntax colour and lightweight validation; JSON, CSV and HTML can be formatted. Escape then Tab leaves the field."
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
                  aria-label="Language"
                  size="sm"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as CodeLanguage)}
                  options={[
                    { value: 'json', label: 'JSON' },
                    { value: 'yaml', label: 'YAML' },
                    { value: 'csv', label: 'CSV' },
                    { value: 'html', label: 'HTML' },
                    { value: 'text', label: 'Plain text' },
                  ]}
                />
                {(lang === 'json' || lang === 'csv' || lang === 'html') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={lintCode(lang, doc) !== null}
                    onClick={() => setDoc(formatCode(lang, doc))}
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
            validate={false}
            options={{ statusBar: false }}
          />
          <span className="pt-2 text-[11px] font-extrabold tracking-[0.07em] text-ink-soft uppercase">
            Controlled wizard gate
          </span>
          <div className="rounded-surface border border-line bg-canvas p-4">
            {wizardStep === 1 ? (
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-[13px] font-extrabold text-ink-strong">
                    Step 1 of 2 · Configuration
                  </div>
                  <div className="text-[12px] text-ink-soft">
                    Correct the trailing comma, then try Next again.
                  </div>
                </div>
                <CodeEditor
                  ref={wizardEditor}
                  label="Wizard configuration"
                  language="json"
                  value={wizardCode}
                  onChange={(next) => {
                    setWizardCode(next)
                    setWizardError(null)
                  }}
                  onInvalid={(problem) => {
                    setWizardError(`Next blocked: ${problem.message}`)
                  }}
                  className="h-64"
                  title="workflow.json"
                />
                {wizardError && <FieldError className="self-start">{wizardError}</FieldError>}
                <div className="flex justify-end gap-2">
                  <Button disabled>Back</Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (wizardEditor.current?.checkValid()) {
                        setWizardError(null)
                        setWizardStep(2)
                      }
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="text-[13px] font-extrabold text-ink-strong">
                  Step 2 of 2 · Review
                </div>
                <pre className="overflow-auto rounded-control bg-code-block p-3 text-[12px] text-ink">
                  {wizardCode}
                </pre>
                <Button className="self-start" onClick={() => setWizardStep(1)}>
                  Back
                </Button>
              </div>
            )}
          </div>
        </Section>

        <Section
          title="DiffViewer"
          note="Myers' diff by line, then again by word inside each changed pair, so the edit itself gets the stronger wash. For JSON, CSV and HTML, Format view normalizes only the read-only comparison while Format editable updates the controlled source values. The CSV specimen deliberately mixes equivalent quoting styles so formatting removes that noise and leaves the real value changes."
        >
          <Row label="Editable">
            <Select
              aria-label="Editable sides"
              size="sm"
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
            language="csv"
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
