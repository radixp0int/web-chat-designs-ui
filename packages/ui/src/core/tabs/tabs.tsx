import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  useState,
  type KeyboardEvent,
} from 'react'
import type {
  TabsActivationMode,
  TabsContentProps,
  TabsListProps,
  TabsListVariant,
  TabsOrientation,
  TabsProps,
  TabsTriggerProps,
} from './types'

type TabsContextValue = {
  value: string | null | undefined
  select: (value: string) => void
  orientation: TabsOrientation
  activationMode: TabsActivationMode
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)
type TabsListContextValue = {
  variant: TabsListVariant
  firstValue?: string
}

const TabsListContext = createContext<TabsListContextValue>({ variant: 'line' })

function useTabs(part: string) {
  const context = useContext(TabsContext)
  if (!context) throw new Error(`${part} must be used inside Tabs`)
  return context
}

function valueId(value: string) {
  return encodeURIComponent(value).replaceAll('%', '-')
}

/**
 * A branded tab set with the same compound shape as shadcn/Radix: root, list,
 * trigger, and content. It supports controlled and uncontrolled selection.
 */
export function Tabs({
  value: controlledValue,
  defaultValue,
  onValueChange,
  allowDeselect = false,
  orientation = 'horizontal',
  activationMode = 'automatic',
  className = '',
  children,
  ...rest
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const baseId = useId()
  const controlled = controlledValue !== undefined
  const value = controlled ? controlledValue : uncontrolledValue

  const select = (next: string) => {
    const selected = allowDeselect && next === value ? null : next
    if (!controlled) setUncontrolledValue(selected)
    if (selected !== value) onValueChange?.(selected)
  }

  return (
    <TabsContext.Provider value={{ value, select, orientation, activationMode, baseId }}>
      <div className={`min-w-0 ${className}`} data-orientation={orientation} {...rest}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

/** The tab rail. `line` matches the app's restrained brand treatment. */
export function TabsList({ variant = 'line', className = '', children, ...rest }: TabsListProps) {
  const { orientation } = useTabs('TabsList')
  const firstTrigger = Children.toArray(children).find(
    (child) => isValidElement<TabsTriggerProps>(child) && child.type === TabsTrigger,
  )
  const firstValue = isValidElement<TabsTriggerProps>(firstTrigger)
    ? firstTrigger.props.value
    : undefined
  const line =
    orientation === 'horizontal'
      ? 'flex items-end gap-5 border-b border-line'
      : 'flex shrink-0 flex-col border-r border-line'
  const contained =
    orientation === 'horizontal'
      ? 'inline-flex items-center gap-1 rounded-control bg-code p-1'
      : 'inline-flex shrink-0 flex-col gap-1 rounded-control bg-code p-1'
  const skin = variant === 'line' ? line : variant === 'contained' ? contained : ''

  return (
    <TabsListContext.Provider value={{ variant, firstValue }}>
      <div
        {...rest}
        role="tablist"
        aria-orientation={orientation}
        className={`${skin} ${className}`}
      >
        {children}
      </div>
    </TabsListContext.Provider>
  )
}

function moveFocus(event: KeyboardEvent<HTMLButtonElement>, orientation: TabsOrientation) {
  const horizontal = orientation === 'horizontal'
  const previous = horizontal ? event.key === 'ArrowLeft' : event.key === 'ArrowUp'
  const next = horizontal ? event.key === 'ArrowRight' : event.key === 'ArrowDown'
  if (!previous && !next && event.key !== 'Home' && event.key !== 'End') return

  const list = event.currentTarget.closest('[role="tablist"]')
  const tabs = Array.from(
    list?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? [],
  )
  if (!tabs.length) return

  event.preventDefault()
  const current = tabs.indexOf(event.currentTarget)
  const index =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : previous
          ? (current - 1 + tabs.length) % tabs.length
          : (current + 1) % tabs.length
  tabs[index]?.focus()
}

/** A native button with roving focus and automatic or manual activation. */
export function TabsTrigger({
  value,
  disabled,
  className = '',
  children,
  onClick,
  onKeyDown,
  onFocus,
  tabIndex,
  controls,
  ...rest
}: TabsTriggerProps) {
  const tabs = useTabs('TabsTrigger')
  const { variant, firstValue } = useContext(TabsListContext)
  const selected = tabs.value === value
  const id = valueId(value)
  const line =
    tabs.orientation === 'horizontal'
      ? '-mb-px h-10 border-b-2 px-1'
      : '-mr-px min-h-9 justify-start border-r-2 px-3'
  const contained = 'min-h-8 rounded-control px-3'
  const unstyled = 'shrink-0 disabled:pointer-events-none disabled:opacity-35'
  const active =
    variant === 'line'
      ? 'border-brand-solid text-brand-fg'
      : 'border-transparent bg-panel-solid text-ink-strong shadow-sm'
  const inactive =
    variant === 'line'
      ? 'border-transparent text-ink-soft hover:bg-tint/6 hover:text-ink-strong'
      : 'border-transparent text-ink-soft hover:text-ink-strong'
  const base =
    variant === 'unstyled'
      ? unstyled
      : `inline-flex shrink-0 items-center gap-2 text-[13px] font-bold whitespace-nowrap transition disabled:pointer-events-none disabled:opacity-35 ${variant === 'line' ? line : contained} ${selected ? active : inactive}`

  return (
    <button
      {...rest}
      type="button"
      role="tab"
      id={`${tabs.baseId}-trigger-${id}`}
      aria-controls={controls === false ? undefined : (controls ?? `${tabs.baseId}-panel-${id}`)}
      aria-selected={selected}
      tabIndex={
        selected ? 0 : tabs.value == null ? (tabIndex ?? (value === firstValue ? 0 : -1)) : -1
      }
      disabled={disabled}
      data-state={selected ? 'active' : 'inactive'}
      className={`${base} ${className}`}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) tabs.select(value)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        moveFocus(event, tabs.orientation)
      }}
      onFocus={(event) => {
        onFocus?.(event)
        if (!event.defaultPrevented && tabs.activationMode === 'automatic') tabs.select(value)
      }}
    >
      {children}
    </button>
  )
}

/** The panel paired to a trigger with the same `value`. */
export function TabsContent({ value, className = '', children, ...rest }: TabsContentProps) {
  const tabs = useTabs('TabsContent')
  const selected = tabs.value === value
  const id = valueId(value)

  if (!selected) return null

  return (
    <div
      {...rest}
      role="tabpanel"
      id={`${tabs.baseId}-panel-${id}`}
      aria-labelledby={`${tabs.baseId}-trigger-${id}`}
      tabIndex={0}
      className={`min-w-0 ${tabs.orientation === 'horizontal' ? 'mt-4' : 'flex-1'} ${className}`}
    >
      {children}
    </div>
  )
}
