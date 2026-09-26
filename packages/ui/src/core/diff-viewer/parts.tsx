import { tokenClass } from '../code-editor/languages'
import { SIGN, tone } from './tone'
import type { Side, SideKind } from './tone'

/** One line's syntax colours, with the changed words washed. */
export function Tokens({ side }: { side: Side }) {
  return side.segments.map((s, i) => (
    <span
      key={i}
      className={[tokenClass[s.kind], s.changed ? `rounded-[3px] ${tone[side.kind].mark}` : '']
        .filter(Boolean)
        .join(' ')}
    >
      {s.text}
    </span>
  ))
}

export function Gutter({
  num,
  kind,
  width = 'w-13',
}: {
  num: number | null
  kind: SideKind
  width?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={`${width} shrink-0 pr-2.5 text-right text-[12px] tabular-nums select-none ${tone[kind].gutter}`}
    >
      {num}
    </span>
  )
}

export function Sign({ kind }: { kind: SideKind }) {
  // Real text rather than aria-hidden, so a screen reader hears "plus" or
  // "minus" before the line — the colour alone would say nothing.
  return (
    <span className={`w-6 shrink-0 text-center select-none ${tone[kind].sign}`}>{SIGN[kind]}</span>
  )
}
