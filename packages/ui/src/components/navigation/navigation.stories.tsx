import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ClockIcon, HomeIcon, LibraryIcon, PlanIcon, SlidersIcon, UserIcon } from '../icons'
import { Button } from '../../core/button'
import { TextInput } from '../../core/text-input'
import { Navigation } from './navigation'
import type { NavigationMode, NavigationProps, NavigationSection } from './types'

const sections: NavigationSection[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    destinations: [
      { id: 'dashboard', label: 'Dashboard', href: '#dashboard', icon: <HomeIcon /> },
      { id: 'tasks', label: 'My tasks', href: '#tasks', icon: <PlanIcon /> },
    ],
  },
  {
    id: 'tenants',
    label: 'Tenant administration',
    destinations: [
      { id: 'setup', label: 'Tenant setup', href: '#setup', icon: <LibraryIcon /> },
      { id: 'promotion', label: 'Tenant promotion', href: '#promotion', icon: <PlanIcon /> },
      { id: 'migration', label: 'Tenant migration', href: '#migration', icon: <LibraryIcon /> },
      {
        id: 'sso',
        label: 'SSO management',
        href: '#sso',
        icon: <UserIcon />,
        keywords: ['single sign on', 'authentication'],
      },
    ],
  },
  {
    id: 'system',
    label: 'System management',
    destinations: [
      { id: 'links', label: 'System links', href: '#links', icon: <SlidersIcon /> },
      { id: 'errors', label: 'App error codes', href: '#errors', icon: <PlanIcon /> },
      { id: 'jobs', label: 'Scheduled jobs', href: '#jobs', icon: <ClockIcon /> },
    ],
  },
  {
    id: 'users',
    label: 'People & organization',
    destinations: [
      { id: 'users', label: 'User management', href: '#users', icon: <UserIcon /> },
      { id: 'organization', label: 'Organization', href: '#organization', icon: <LibraryIcon /> },
      { id: 'billing', label: 'Billing administration', href: '#billing', icon: <PlanIcon /> },
    ],
  },
  {
    id: 'build',
    label: 'Build & insights',
    destinations: [
      { id: 'solutions', label: 'Solution builder', href: '#solutions', icon: <LibraryIcon /> },
      { id: 'apps', label: 'App builder', href: '#apps', icon: <SlidersIcon /> },
      { id: 'reports', label: 'Reports', href: '#reports', icon: <PlanIcon /> },
      { id: 'operations', label: 'Operation dashboard', href: '#operations', icon: <HomeIcon /> },
    ],
  },
]

function NavigationStory(args: NavigationProps) {
  const [mode, setMode] = useState<NavigationMode>(args.mode ?? 'expanded')
  const [activeId, setActiveId] = useState(args.activeId)
  const [pinnedIds, setPinnedIds] = useState(args.pinnedIds)
  const [menuOpen, setMenuOpen] = useState(args.menuOpen)
  const destination = args.sections
    .flatMap((section) => section.destinations)
    .find((item) => item.id === activeId)
  return (
    <div className="@container overflow-hidden rounded-surface border border-line bg-panel-solid">
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 text-[13px]">
        <span className="font-semibold text-ink-strong">
          Acme <span className="font-normal text-ink-soft">/ Production</span>
        </span>
        <span className="text-ink-soft">Workspace</span>
      </header>
      <div className="flex min-h-[520px] flex-col @2xl:flex-row">
        <Navigation
          {...args}
          mode={mode}
          onModeChange={(next) => {
            setMode(next)
            args.onModeChange?.(next)
          }}
          activeId={activeId}
          pinnedIds={pinnedIds}
          menuOpen={menuOpen}
          onNavigate={(item, event) => {
            event.preventDefault()
            setActiveId(item.id)
            args.onNavigate?.(item, event)
          }}
          onPinnedIdsChange={(ids) => {
            setPinnedIds(ids)
            args.onPinnedIdsChange(ids)
          }}
          onMenuOpenChange={(open) => {
            setMenuOpen(open)
            args.onMenuOpenChange(open)
          }}
        />
        <main className="min-w-0 flex-1 p-6 sm:p-8" aria-label="Destination preview">
          <p className="text-xs text-ink-soft">
            {args.sections.find((section) =>
              section.destinations.some((item) => item.id === activeId),
            )?.label ?? 'Workspace'}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-strong">
            {destination?.label ?? 'Choose a destination'}
          </h1>
          <p className="mt-2 text-[13px] text-ink-soft">
            {activeId === 'setup'
              ? 'Manage the tenants in your workspace.'
              : 'Navigation preview for the selected destination.'}
          </p>
          {activeId === 'setup' && (
            <div className="mt-8 divide-y divide-line border-y border-line">
              {['Acme North America', 'Acme Europe', 'Acme Sandbox'].map((name) => (
                <div key={name} className="flex flex-wrap justify-between gap-2 py-4 text-[13px]">
                  <span className="text-ink">{name}</span>
                  <span className="text-ink-soft">
                    {name.includes('Sandbox') ? 'Sandbox' : 'Active'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

const meta = {
  title: 'Primitives/Components/Navigation',
  component: Navigation,
  tags: ['autodocs'],
  args: {
    sections,
    mode: 'expanded',
    onModeChange: fn(),
    activeId: 'setup',
    pinnedIds: ['setup', 'jobs', 'reports'],
    menuOpen: false,
    onNavigate: fn(),
    onPinnedIdsChange: fn(),
    onMenuOpenChange: fn(),
  },
  argTypes: { sections: { control: false }, onNavigate: { control: false } },
  render: (args) => (
    <NavigationStory
      key={JSON.stringify([args.activeId, args.pinnedIds, args.menuOpen, args.mode])}
      {...args}
    />
  ),
  parameters: {
    docs: {
      description: {
        component:
          'Pinned route links with contextual section navigation and a searchable All apps dialog. The host owns routing, permissions, pins and menu visibility. Unlike SideTabs, the active destination cannot be deselected. Uses native links, Tooltip, TextInput and Modal; the theme toolbar supplies palette, mode and density.',
      },
    },
  },
} satisfies Meta<typeof Navigation>

export default meta
type Story = StoryObj<typeof meta>
export const Playground: Story = {}
export const RailOnly: Story = { args: { mode: 'rail' } }
export const QuickMenuOpen: Story = { args: { menuOpen: true } }
export const NoPins: Story = { args: { pinnedIds: [] } }
export const SystemSection: Story = { args: { activeId: 'jobs' } }
export const UnpinnedDestination: Story = { args: { activeId: 'sso' } }
export const Empty: Story = { args: { sections: [], pinnedIds: [], activeId: '' } }
export const Narrow: Story = {
  globals: { viewport: { value: 'mobile1' } },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [
    (Story) => (
      <div className="max-w-[360px]">
        <Story />
      </div>
    ),
  ],
}

export const SearchAndPin: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'All apps' }))
    const dialog = within(canvasElement.ownerDocument.body).getByRole('dialog', {
      name: 'All apps',
    })
    const menu = within(dialog)
    await userEvent.type(
      menu.getByRole('textbox', { name: 'Search destinations' }),
      'single sign on',
    )
    await expect(menu.getByRole('link', { name: /SSO management/ })).toBeVisible()
    await userEvent.click(menu.getByRole('button', { name: 'Pin SSO management' }))
    await userEvent.click(menu.getByRole('link', { name: /SSO management/ }))
    await expect(canvas.getByRole('heading', { name: 'SSO management' })).toBeVisible()
    await expect(
      within(canvas.getByRole('navigation', { name: 'Pinned navigation' })).getByRole('link', {
        name: 'SSO management',
      }),
    ).toHaveAttribute('aria-current', 'page')
  },
}
export const NoSearchResults: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'All apps' }))
    const menu = within(
      within(canvasElement.ownerDocument.body).getByRole('dialog', { name: 'All apps' }),
    )
    await userEvent.type(
      menu.getByRole('textbox', { name: 'Search destinations' }),
      'unavailable-destination',
    )
    await expect(menu.getByText('No destinations found. Try another search.')).toBeVisible()
  },
}

/** The page owns focus mode and retains the browsing layout while the wizard is open. */
function WizardExample(args: NavigationProps) {
  const [mode, setMode] = useState<NavigationMode>('expanded')
  const [step, setStep] = useState<number | null>(null)
  const [activeId, setActiveId] = useState(args.activeId)
  const [pins, setPins] = useState(args.pinnedIds)
  const [menuOpen, setMenuOpen] = useState(false)
  const [name, setName] = useState('Acme Asia Pacific')
  const [region, setRegion] = useState('Asia Pacific')
  const [complete, setComplete] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const start = useRef<HTMLButtonElement>(null)
  const wasInWizard = useRef(false)
  useEffect(() => {
    if (step !== null) {
      heading.current?.focus()
      wasInWizard.current = true
    } else if (wasInWizard.current) {
      start.current?.focus()
      wasInWizard.current = false
    }
  }, [step])
  const steps = ['Tenant details', 'Region', 'Review']
  return (
    <div className="@container overflow-hidden rounded-surface border border-line bg-panel-solid text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 text-[13px]">
        <span className="font-semibold">
          Acme <span className="font-normal text-ink-soft">/ Production</span>
        </span>
        {step !== null ? (
          <Button variant="ghost" onClick={() => setStep(null)}>
            Exit setup
          </Button>
        ) : (
          <span className="text-ink-soft">Workspace</span>
        )}
      </header>
      <div className="flex min-h-[520px] flex-col @2xl:flex-row">
        <Navigation
          {...args}
          mode={step === null ? mode : 'hidden'}
          onModeChange={setMode}
          activeId={activeId}
          pinnedIds={pins}
          onPinnedIdsChange={setPins}
          menuOpen={menuOpen}
          onMenuOpenChange={setMenuOpen}
          onNavigate={(destination, event) => {
            event.preventDefault()
            setActiveId(destination.id)
          }}
        />
        <main className="min-w-0 flex-1 p-6 sm:p-8">
          {step === null ? (
            <>
              <p className="text-xs text-ink-soft">Tenant administration</p>
              <h1 className="mt-3 text-2xl font-semibold text-ink-strong">
                {
                  args.sections
                    .flatMap((section) => section.destinations)
                    .find((destination) => destination.id === activeId)?.label
                }
              </h1>
              <p className="mt-2 mb-6 text-[13px] text-ink-soft">
                Create a tenant with a guided setup.
              </p>
              {complete && (
                <p role="status" className="mb-5 text-[13px] text-ink">
                  Setup preview completed for {name}. No tenant was created.
                </p>
              )}
              <Button
                ref={start}
                variant="primary"
                onClick={() => {
                  setMenuOpen(false)
                  setComplete(false)
                  setStep(0)
                }}
              >
                Create tenant
              </Button>
            </>
          ) : (
            <div className="mx-auto max-w-xl">
              <ol
                aria-label="Setup progress"
                className="mb-10 flex flex-wrap gap-3 text-xs text-ink-soft"
              >
                {steps.map((label, index) => (
                  <li
                    key={label}
                    aria-current={index === step ? 'step' : undefined}
                    className={index === step ? 'font-semibold text-brand-fg' : ''}
                  >
                    {index + 1}. {label}
                  </li>
                ))}
              </ol>
              <p className="text-xs text-ink-soft">Create tenant · Step {step + 1} of 3</p>
              <h1
                ref={heading}
                tabIndex={-1}
                className="mt-3 mb-6 text-2xl font-semibold text-ink-strong"
              >
                {steps[step]}
              </h1>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  if (step < 2) setStep(step + 1)
                  else {
                    setComplete(true)
                    setStep(null)
                  }
                }}
              >
                {step === 0 && (
                  <label className="flex flex-col gap-2 text-[13px]">
                    Tenant name
                    <TextInput
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>
                )}
                {step === 1 && (
                  <fieldset className="space-y-3">
                    <legend className="mb-3 text-[13px]">Choose a region</legend>
                    {['North America', 'Europe', 'Asia Pacific'].map((value) => (
                      <label
                        key={value}
                        className="flex items-center gap-3 rounded-control border border-line p-3 text-[13px]"
                      >
                        <input
                          type="radio"
                          name="region"
                          value={value}
                          checked={region === value}
                          onChange={() => setRegion(value)}
                        />
                        {value}
                      </label>
                    ))}
                  </fieldset>
                )}
                {step === 2 && (
                  <dl className="grid grid-cols-2 gap-4 border-y border-line py-5 text-[13px]">
                    <dt className="text-ink-soft">Tenant name</dt>
                    <dd>{name}</dd>
                    <dt className="text-ink-soft">Region</dt>
                    <dd>{region}</dd>
                  </dl>
                )}
                <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-5">
                  <Button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                  <Button type="submit" variant="primary" disabled={!name.trim()}>
                    {step === 2 ? 'Finish preview' : 'Continue'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export const WizardFlow: Story = {
  render: (args) => <WizardExample {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'Collapse the navigation, then choose Create tenant. The wizard hides both navigation panels. Exit setup or Finish preview restores your previous layout and keeps the active route and pins. This is a local UI demonstration; it creates no tenant.',
      },
    },
  },
}

export const WizardRestoresRail: Story = {
  render: (args) => <WizardExample {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse navigation' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Create tenant' }))
    await expect(
      canvas.queryByRole('navigation', { name: 'Pinned navigation' }),
    ).not.toBeInTheDocument()
    await expect(
      canvas.queryByRole('navigation', { name: 'Section navigation' }),
    ).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))
    await expect(canvas.getByRole('heading', { name: 'Review' })).toHaveFocus()
    await userEvent.click(canvas.getByRole('button', { name: 'Exit setup' }))
    await expect(canvas.getByRole('navigation', { name: 'Pinned navigation' })).toBeVisible()
    await expect(
      canvas.queryByRole('navigation', { name: 'Section navigation' }),
    ).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Create tenant' })).toHaveFocus()
    await userEvent.click(canvas.getByRole('button', { name: 'Expand navigation' }))
    await expect(canvas.getByRole('navigation', { name: 'Section navigation' })).toBeVisible()
  },
}
