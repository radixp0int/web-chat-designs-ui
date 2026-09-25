import type { Source } from '../../types'

export type SourceStripProps = {
  sources: Source[]
  onCite: (id: number) => void
}
