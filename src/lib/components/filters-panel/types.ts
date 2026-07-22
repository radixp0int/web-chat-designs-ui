import type { ActiveFilter } from '../../types'

export type FiltersPanelProps = {
  filters: ActiveFilter[]
  onRemove: (id: string) => void
  onClear: () => void
}
