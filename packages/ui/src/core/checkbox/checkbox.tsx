import type { CheckboxProps } from './types'

/**
 * A native checkbox, tinted with `accent-color`.
 *
 * Native on purpose. A div-based box has to re-implement focus, the space key,
 * form participation and `indeterminate`, and the only thing it buys is a
 * custom tick — which `accent-color` already gets us for the cost of one
 * declaration.
 *
 * `indeterminate` is the one thing HTML will not let us set declaratively, so
 * the callback ref below is load-bearing rather than a workaround: React never
 * writes that property from JSX.
 */
export function Checkbox({
  indeterminate = false,
  label,
  meta,
  className = '',
  ref,
  ...rest
}: CheckboxProps) {
  const box = (
    <input
      type="checkbox"
      ref={(node) => {
        if (node) node.indeterminate = indeterminate
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      aria-checked={indeterminate ? 'mixed' : undefined}
      checked={indeterminate ? false : rest.checked}
      className={[
        'size-[15px] shrink-0 cursor-pointer accent-[var(--brand-solid)]',
        'disabled:cursor-not-allowed disabled:opacity-40',
        label ? '' : className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  )

  if (!label) return box

  return (
    <label
      className={['flex cursor-pointer items-center gap-2.5 text-[13px] text-ink', className]
        .filter(Boolean)
        .join(' ')}
    >
      {box}
      <span className="grow">{label}</span>
      {meta != null && (
        <span className="shrink-0 text-[11.5px] font-bold text-ink-soft tabular-nums">{meta}</span>
      )}
    </label>
  )
}
