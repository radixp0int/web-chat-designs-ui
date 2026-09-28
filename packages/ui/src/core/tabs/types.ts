import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode, Ref } from 'react'

export type TabsOrientation = 'horizontal' | 'vertical'
export type TabsActivationMode = 'automatic' | 'manual'
export type TabsListVariant = 'line' | 'contained' | 'unstyled'

export type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> & {
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
  /** Selecting the active trigger again clears the value. */
  allowDeselect?: boolean
  orientation?: TabsOrientation
  activationMode?: TabsActivationMode
  children: ReactNode
}

export type TabsListProps = HTMLAttributes<HTMLDivElement> & {
  variant?: TabsListVariant
  ref?: Ref<HTMLDivElement>
}

export type TabsTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> & {
  value: string
  /** Override the controlled panel id, or disable aria-controls for externally rendered panels. */
  controls?: string | false
}

export type TabsContentProps = HTMLAttributes<HTMLDivElement> & {
  value: string
}
