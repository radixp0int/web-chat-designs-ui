import type { CodeTokenKind } from '../code-editor'

export type Segment = { text: string; kind: CodeTokenKind; changed: boolean }
export type SideKind = 'equal' | 'delete' | 'insert' | 'empty'
export type Side = { kind: SideKind; num: number | null; segments: Segment[] }

/**
 * Added lines are the accent, removed lines --danger — not the usual green.
 * brand.css has no green ramp (see Pill's tones), and a hard-coded one would
 * be the only colour in the library that ignores a `chat-theme-*` switch and
 * dark mode. Blue against red also parts more clearly than green against red
 * for the commonest colour-vision deficiencies, and the +/− column carries
 * the meaning for anyone who cannot separate them at all.
 */
export const tone: Record<SideKind, { row: string; gutter: string; sign: string; mark: string }> = {
  equal: { row: '', gutter: 'text-ink-soft', sign: '', mark: '' },
  delete: {
    row: 'bg-danger/8',
    gutter: 'bg-danger/14 text-danger-fg',
    sign: 'text-danger-fg',
    mark: 'bg-danger/25',
  },
  insert: {
    row: 'bg-accent/8',
    gutter: 'bg-accent/15 text-accent-fg',
    sign: 'text-accent-fg',
    mark: 'bg-accent/25',
  },
  empty: { row: '', gutter: '', sign: '', mark: '' },
}

export const HATCH = {
  backgroundImage: 'repeating-linear-gradient(-45deg, var(--line) 0 1px, transparent 1px 7px)',
}

export const SIGN: Record<SideKind, string> = { equal: '', delete: '−', insert: '+', empty: '' }
