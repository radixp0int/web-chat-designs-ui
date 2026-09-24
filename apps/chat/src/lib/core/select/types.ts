import type { ReactNode, Ref, SelectHTMLAttributes } from 'react'

export type SelectSize = 'sm' | 'md'

export type SelectOption = {
  value: string | number
  label: ReactNode
  disabled?: boolean
}

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'children'> & {
  selectSize?: SelectSize
  /** Rendered as `<option>`s. Pass `children` instead for groups. */
  options?: SelectOption[]
  children?: ReactNode
  /** Visually hidden unless `showLabel` — a select still needs an accessible name. */
  label: string
  showLabel?: boolean
  ref?: Ref<HTMLSelectElement>
}
