import type { InputHTMLAttributes, ReactNode, Ref } from 'react'

export type TextInputSize = 'sm' | 'md' | 'lg'

// `prefix` is a real (global) HTML attribute typed as string, so it has to be
// dropped before ours is declared — otherwise the two intersect into
// `string & ReactNode` and no element is assignable to it.
type TextInputBaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> & {
  inputSize?: TextInputSize
  /** Leading glyph inside the field. */
  icon?: ReactNode
  /** Chips, a scope button — anything rendered before the text cursor. */
  prefix?: ReactNode
  /** A `⌘K` hint, a unit — rendered after the field. */
  suffix?: ReactNode
  ref?: Ref<HTMLInputElement>
}

/** A clear button must always have a caller-provided accessible name. */
type TextInputClearProps =
  | { onClear?: undefined; clearLabel?: never }
  | { onClear: () => void; clearLabel: string }

export type TextInputProps = TextInputBaseProps & TextInputClearProps
