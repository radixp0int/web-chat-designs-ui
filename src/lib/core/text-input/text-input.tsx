import { XIcon } from '../../components/icons'
import { IconButton } from '../../components/icon-button'
import type { TextInputProps, TextInputSize } from './types'

const boxes: Record<TextInputSize, string> = {
  sm: 'h-8 gap-1.5 px-2.5 text-[12.5px]',
  md: 'h-9 gap-2 px-3 text-[13px]',
  lg: 'h-11 gap-2 px-3 text-sm',
}

/**
 * A text field and the things that sit beside it.
 *
 * `prefix` exists because the table's search field is not just a field — it
 * carries the active filters as chips, inside the same border, so that one
 * control reads as one idea. Keeping that in the primitive means the table
 * does not have to rebuild the box to add them.
 *
 * The shell carries the border and the focus-within ring; the `<input>` itself
 * is borderless and transparent. That is what lets prefix, clear and suffix
 * sit inside the same outline without any of them being inside the input's own
 * padding box.
 */
export function TextInput({
  inputSize = 'md',
  label,
  showLabel = false,
  icon,
  onClear,
  prefix,
  suffix,
  className = '',
  id,
  ref,
  ...rest
}: TextInputProps) {
  const inputId = id ?? `in-${label.replace(/\s+/g, '-').toLowerCase()}`
  const hasValue = rest.value != null && String(rest.value).length > 0

  return (
    <span className={['inline-flex min-w-0 flex-col gap-1', className].filter(Boolean).join(' ')}>
      <label
        htmlFor={inputId}
        className={showLabel ? 'text-[12.5px] font-bold text-ink-soft' : 'sr-only'}
      >
        {label}
      </label>
      <span
        className={[
          'inline-flex min-w-0 items-center rounded-lg border border-line bg-panel-solid transition',
          'focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/20',
          boxes[inputSize],
        ].join(' ')}
      >
        {icon && (
          <span className="inline-grid shrink-0 place-items-center text-ink-soft">{icon}</span>
        )}
        {prefix}
        <input
          id={inputId}
          ref={ref}
          className="min-w-0 grow bg-transparent text-ink outline-none placeholder:text-ink-soft"
          {...rest}
        />
        {onClear && hasValue && (
          <IconButton
            size="sm"
            shape="rounded"
            onClick={onClear}
            aria-label={`Clear ${label}`}
            title="Clear"
          >
            <XIcon width={11} height={11} />
          </IconButton>
        )}
        {suffix}
      </span>
    </span>
  )
}
