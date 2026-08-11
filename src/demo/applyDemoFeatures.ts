import type { Message } from '../lib/types'
import type { DemoFlags } from './demoFeatures'

/**
 * Hides switched-off features by stripping the fields that drive them, just
 * before render. Gating here rather than inside the components keeps every
 * demo flag out of lib/ — a shared component only ever sees a message that
 * genuinely lacks reasoning, tools, or sources.
 *
 * `actions` has no field to strip; it rides the ChatMessage `showActions` prop.
 */
export function applyDemoFeatures(messages: Message[], flags: DemoFlags): Message[] {
  if (flags.thinking && flags.tools && flags.sources && flags.followups && flags.trace)
    return messages

  return messages.map((m) => {
    if (m.role !== 'assistant') return m
    const next = { ...m }
    if (!flags.thinking) {
      delete next.thinking
      delete next.thinkingActive
      delete next.thinkingSec
    }
    if (!flags.tools) delete next.tools
    if (!flags.sources) {
      // Markdown only linkifies [n] when sources are present, so the markers
      // degrade to plain text rather than becoming dead links.
      delete next.sources
      delete next.highlights
    }
    if (!flags.followups) delete next.followups
    // Only the trace goes — a failed turn keeps its error alert, which is a
    // recovery path rather than a detail the presenter would switch off.
    if (!flags.trace) delete next.trace
    return next
  })
}
