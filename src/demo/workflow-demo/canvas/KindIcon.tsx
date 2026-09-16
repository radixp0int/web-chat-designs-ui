// Who does the work. This is the one mark that survives every zoom tier, so it
// carries the distinction the whole canvas rests on: agent, person, system, gate.
import { DiamondIcon, InboxIcon, PersonIcon, PlugIcon } from './icons'
import type { StepKind } from './types'

/**
 * Initials only where they survive at full scale.
 *
 * The trap is that a node avatar is authored at 20px but drawn through React
 * Flow's viewport transform, so at the detail tier's 0.7-1.0 zoom its 7.2px text
 * reaches the screen at 5.2-7.2px. Fitting two letters inside the circle was
 * never the whole problem; the rendered size was. Anything below this falls back
 * to a person glyph, which reads at any scale, and the name lives in the node's
 * own text and the detail panel where there is room for it.
 */
const INITIALS_MIN = 30

export function KindIcon({
  kind,
  initials,
  size = 20,
}: {
  kind: StepKind
  initials?: string
  size?: number
}) {
  if (kind === 'agent') {
    return (
      <span
        className="orb block shrink-0 rounded-full"
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }
  // Two letters in a CIRCLE, not a square: they have to stay inside the inscribed
  // square (diameter × 0.707) or they run into the curve. "DW" bold measures
  // ~1.86× its font size, so 0.36 puts the text at ~0.67 of the diameter. 0.42
  // put it at 0.80 — inside the box, but visibly jammed against the edge.
  if (kind === 'human' && initials && size >= INITIALS_MIN) {
    return (
      <span
        className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-solid font-bold text-on-brand-solid"
        style={{ width: size, height: size, fontSize: size * 0.36, lineHeight: 1 }}
        aria-hidden
      >
        {initials}
      </span>
    )
  }
  // Too small for initials, but still a named person — so a FILLED person, which
  // reads at any size. The dashed outline below stays reserved for a step routed
  // to a role rather than to someone in particular.
  if (kind === 'human' && initials) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full bg-brand-solid text-on-brand-solid"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <PersonIcon width={size * 0.6} height={size * 0.6} strokeWidth={2.2} />
      </span>
    )
  }
  if (kind === 'human') {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full border border-dashed border-ink-soft/70 text-ink-soft"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <PersonIcon
          width={Math.round(size * 0.62)}
          height={Math.round(size * 0.62)}
          strokeWidth={2}
        />
      </span>
    )
  }
  const Glyph = kind === 'tool' ? PlugIcon : kind === 'decision' ? DiamondIcon : InboxIcon
  return (
    <span
      className="grid shrink-0 place-items-center rounded-md bg-chip text-chip-fg"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Glyph width={Math.round(size * 0.66)} height={Math.round(size * 0.66)} strokeWidth={2} />
    </span>
  )
}
