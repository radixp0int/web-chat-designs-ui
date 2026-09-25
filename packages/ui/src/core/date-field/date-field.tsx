import { useId } from 'react'
import type { DateFieldProps, DateRangeFieldProps } from './types'

const box =
  'h-9 w-full rounded-lg border border-line bg-panel-solid px-2.5 text-[13px] text-ink transition ' +
  'accent-[var(--brand-solid)] focus-within:border-accent disabled:pointer-events-none disabled:opacity-40'

/**
 * A date, on a native `<input type="date">`.
 *
 * Native rather than a calendar library, and it is a deliberate call rather
 * than a shortcut. What the platform control already gets right: keyboard
 * entry segment by segment, the user's own locale and first-day-of-week, a
 * real date picker on desktop, the OS wheel picker on phones, and correct
 * behaviour for screen readers. A JS calendar re-implements all of that, and
 * usually ships a stylesheet of hard-coded colours — which in this library
 * means the first control that ignores a `chat-theme-*` switch.
 *
 * The cost is honest: the field's text layout is the browser's, so it will not
 * match a designed input to the pixel across Safari and Chrome. If a custom
 * calendar is wanted later it belongs behind this same props shape, so nothing
 * that consumes it has to change.
 */
export function DateField({
  label,
  showLabel = false,
  value,
  onChange,
  min,
  max,
  disabled = false,
  className = '',
  id,
}: DateFieldProps) {
  const auto = useId()
  const inputId = id ?? auto

  return (
    <span className={['flex min-w-0 flex-col gap-1', className].filter(Boolean).join(' ')}>
      <label
        htmlFor={inputId}
        className={showLabel ? 'text-[12px] font-bold text-ink-soft' : 'sr-only'}
      >
        {label}
      </label>
      <input
        id={inputId}
        type="date"
        value={value ?? ''}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        className={box}
      />
    </span>
  )
}

/**
 * Two dates that bound each other.
 *
 * The `min`/`max` cross-wiring is the whole reason this is a component and not
 * two `DateField`s: once a start is chosen, the end input cannot offer a day
 * before it, so an impossible range is never entered in the first place and
 * there is no error message to write.
 */
export function DateRangeField({
  label,
  showLabel = true,
  value,
  onChange,
  min,
  max,
  disabled = false,
  className = '',
}: DateRangeFieldProps) {
  return (
    <div className={['flex min-w-0 flex-col gap-1.5', className].filter(Boolean).join(' ')}>
      {showLabel && <span className="text-[12px] font-bold text-ink-soft">{label}</span>}
      <div className="flex min-w-0 items-center gap-1.5">
        <DateField
          label={`${label} from`}
          value={value.from}
          min={min}
          max={value.to ?? max}
          disabled={disabled}
          onChange={(from) => onChange({ ...value, from })}
          className="grow"
        />
        <span aria-hidden="true" className="shrink-0 text-[12px] text-ink-soft">
          to
        </span>
        <DateField
          label={`${label} to`}
          value={value.to}
          min={value.from ?? min}
          max={max}
          disabled={disabled}
          onChange={(to) => onChange({ ...value, to })}
          className="grow"
        />
      </div>
    </div>
  )
}
