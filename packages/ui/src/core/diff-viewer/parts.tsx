import { tokenClass } from '../code-editor/languages'
import { splitSearchParts } from '../find-replace-model'
import { SIGN, tone } from './tone'
import type { Side, SideKind } from './tone'

/** One line's syntax colours, with diff and find matches layered independently. */
export function Tokens({
  side,
  search,
}: {
  side: Side
  search?: { query: string; activeStart?: number }
}) {
  return splitSearchParts(side.segments, search?.query ?? '').map((part, i) => {
    const matched = part.matchStart !== null
    const current = matched && search?.activeStart === part.matchStart
    const contents = (
      <span
        className={[
          tokenClass[part.source.kind],
          part.source.changed ? `rounded-[3px] ${tone[side.kind].mark}` : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {part.text}
      </span>
    )
    return matched ? (
      <mark
        key={i}
        data-current-search={current || undefined}
        className={`rounded-[2px] text-inherit ${current ? 'bg-brand-solid/35 ring-1 ring-brand-fg' : 'bg-caution/35'}`}
      >
        {contents}
      </mark>
    ) : (
      <span key={i}>{contents}</span>
    )
  })
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
