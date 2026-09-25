import type { InputHTMLAttributes, ReactNode, Ref } from 'react'

export type TextInputSize = 'sm' | 'md' | 'lg'

// `prefix` is a real (global) HTML attribute typed as string, so it has to be
// dropped before ours is declared — otherwise the two intersect into
// `string & ReactNode` and no element is assignable to it.
export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> & {
  inputSize?: TextInputSize
  /** Visually hidden unless `showLabel`. Always required — see `Select`. */
  label: string
  showLabel?: boolean
  /** Leading glyph inside the field. */
  icon?: ReactNode
  /** Shows a clear button while the field has a value. */
  onClear?: () => void
  /** Chips, a scope button — anything rendered before the text cursor. */
  prefix?: ReactNode
  /** A `⌘K` hint, a unit — rendered after the field. */
  suffix?: ReactNode
  ref?: Ref<HTMLInputElement>
}
