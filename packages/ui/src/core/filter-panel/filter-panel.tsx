import { PinIcon, SearchIcon, XIcon } from '../../components/icons'
import { IconButton } from '../../components/icon-button'
import { Checkbox } from '../checkbox'
import { DateField, DateRangeField } from '../date-field'
import { Select } from '../select'
import { Switch } from '../switch'
import { TextInput } from '../text-input'
import type { FilterField, FilterPanelProps, OptionsFilterField } from './types'

const SELECT_THRESHOLD = 8

function OptionsField({ field }: { field: OptionsFilterField }) {
  const { options, value, onChange, multiple = true, selectThreshold = SELECT_THRESHOLD } = field

  // Past the threshold a checkbox list stops being scannable, so it becomes a
  // select regardless of `multiple` — one-of is the only thing a native select
  // does well, and a multi-select listbox is worse than either.
  if (!multiple || options.length > selectThreshold) {
    return (
      <Select
        id={`${field.id}-control`}
        aria-labelledby={`${field.id}-label`}
        selectSize="sm"
        value={value[0] ?? ''}
        onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
        className="w-full"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
            {o.count != null ? ` (${o.count.toLocaleString()})` : ''}
          </option>
        ))}
      </Select>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => (
        <Checkbox
          key={o.value}
          label={o.label}
          meta={o.count?.toLocaleString()}
          checked={value.includes(o.value)}
          onChange={(e) =>
            onChange(e.target.checked ? [...value, o.value] : value.filter((v) => v !== o.value))
          }
        />
      ))}
    </div>
  )
}

function Field({ field }: { field: FilterField }) {
  switch (field.type) {
    case 'string':
      return (
        <TextInput
          id={`${field.id}-control`}
          aria-labelledby={`${field.id}-label`}
          inputSize="sm"
          placeholder={field.placeholder ?? 'Any'}
          icon={<SearchIcon width={13} height={13} />}
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
          onClear={() => field.onChange('')}
          clearLabel={`Clear ${field.label}`}
          className="w-full"
        />
      )
    case 'options':
      return <OptionsField field={field} />
    case 'boolean':
      return (
        <Switch label={field.label} hideLabel checked={field.value} onChange={field.onChange} />
      )
    case 'date':
      return (
        <DateField
          id={`${field.id}-control`}
          label={field.label}
          value={field.value}
          min={field.min}
          max={field.max}
          onChange={field.onChange}
        />
      )
    case 'dateRange':
      return (
        <DateRangeField
          label={field.label}
          showLabel={false}
          value={field.value}
          min={field.min}
          max={field.max}
          onChange={field.onChange}
        />
      )
  }
}

/**
 * The filter rail, in one component, wherever it is shown.
 *
 * Fields are data. A host describes what can be filtered — a string, a set of
 * options, a boolean, a date, a range — and this decides how each one is
 * drawn. That is what keeps the two placements honest: floating over the
 * table on a narrow screen, docked beside it when pinned, same component
 * either way, so a field can never exist in one and be missing from the other.
 *
 * Inert, like the rest of core: it holds no filter state, counts nothing, and
 * every value and setter belongs to the host.
 */
export function FilterPanel({
  fields,
  title = 'Refine',
  activeCount,
  onReset,
  pinned = false,
  onPinnedChange,
  onClose,
  className = '',
}: FilterPanelProps) {
  return (
    <div
      className={['flex flex-col gap-4 rounded-xl border border-line bg-panel-solid p-4', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center gap-1.5">
        <span className="grow text-[11px] font-extrabold tracking-[0.07em] text-ink-soft uppercase">
          {title}
          {activeCount != null && activeCount > 0 && (
            <span className="ml-1.5 text-accent-fg tabular-nums">{activeCount}</span>
          )}
        </span>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-1 text-[12px] font-bold text-brand-fg"
          >
            Reset
          </button>
        )}

        {onPinnedChange && (
          <IconButton
            size="sm"
            shape="rounded"
            active={pinned}
            aria-pressed={pinned}
            onClick={() => onPinnedChange(!pinned)}
            aria-label={
              pinned ? 'Unpin filters — float over the table' : 'Pin filters beside the table'
            }
            title={pinned ? 'Unpin' : 'Pin beside the table'}
          >
            <PinIcon width={14} height={14} />
          </IconButton>
        )}

        {!pinned && onClose && (
          <IconButton
            size="sm"
            shape="rounded"
            onClick={onClose}
            aria-label="Close filters"
            title="Close"
          >
            <XIcon width={13} height={13} />
          </IconButton>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {fields.map((field) => (
          <div key={field.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              {field.type === 'string' || field.type === 'options' ? (
                <label
                  id={`${field.id}-label`}
                  htmlFor={`${field.id}-control`}
                  className="text-[12.5px] font-extrabold text-ink-strong"
                >
                  {field.label}
                </label>
              ) : (
                <span
                  id={`${field.id}-label`}
                  className="text-[12.5px] font-extrabold text-ink-strong"
                >
                  {field.label}
                </span>
              )}
              {field.type === 'boolean' && (
                <Switch
                  id={`${field.id}-control`}
                  label={field.label}
                  hideLabel
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            </div>
            {field.hint && <span className="text-[11.5px] text-ink-soft">{field.hint}</span>}
            {field.type !== 'boolean' && <Field field={field} />}
          </div>
        ))}
      </div>
    </div>
  )
}
