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
  icon,
  onClear,
  clearLabel,
  prefix,
  suffix,
  className = '',
  ref,
  ...rest
}: TextInputProps) {
  const hasValue = rest.value != null && String(rest.value).length > 0
  const invalid = rest['aria-invalid'] === true || rest['aria-invalid'] === 'true'

  return (
    <span
      className={[
        'inline-flex min-w-0 items-center rounded-lg border bg-panel-solid transition',
        invalid
          ? 'border-danger focus-within:ring-3 focus-within:ring-danger/15'
          : 'border-line hover:border-ink-soft/40 focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/20',
        rest.disabled ? 'pointer-events-none opacity-40' : '',
        rest.readOnly ? 'bg-tint/5' : '',
        boxes[inputSize],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && (
        <span className="inline-grid shrink-0 place-items-center text-ink-soft">{icon}</span>
      )}
      {prefix}
      <input
        ref={ref}
        className="min-w-0 grow bg-transparent text-ink outline-none placeholder:text-ink-soft"
        {...rest}
      />
      {onClear && hasValue && (
        <IconButton
          size="sm"
          shape="rounded"
          onClick={onClear}
          disabled={rest.disabled || rest.readOnly}
          aria-label={clearLabel}
          title={clearLabel}
        >
          <XIcon width={11} height={11} />
        </IconButton>
      )}
      {suffix}
    </span>
  )
}
