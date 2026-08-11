import type { ReactNode } from 'react'

/** One tool call made by the assistant while producing a response. */
export type ToolCall = {
  toolCallId: string
  name: string
  status: 'started' | 'completed' | 'failed'
  input?: Record<string, unknown>
  output?: unknown
  error?: string
}

/**
 * One problem reported during a turn — a dropped connection, a failed tool, a
 * degraded subsystem.
 *
 * Responders report these two ways and both end up here: streamed as they
 * happen (which is how the fault earns a place on the timeline), or listed in
 * bulk when the answer completes (which is how a server that only tallies
 * problems at the end reports them). Everything past `message` is optional, so
 * a responder that knows nothing but the text still works.
 */
export type TurnFault = {
  message: string
  /** Stable machine code, when the responder supplies one. Also the identity
   *  used to dedupe a fault that arrives by both routes. */
  code?: string
  /** Which part of the turn it came from — 'retrieval', 'tool:live_quote'. */
  source?: string
  /** Times it occurred, when the responder collapses repeats. */
  count?: number
  /** Structured payload; the row expands to show it as JSON. */
  detail?: Record<string, unknown>
}

/**
 * One phase of an assistant turn, timed from the turn's start. Reasoning,
 * answering, and each tool call get a step; so does any fault, which is the
 * only kind carrying a `fault` payload.
 */
export type TurnStep = {
  /** Unique within a turn. Tool steps use their toolCallId. */
  id: string
  /** 'Reasoning', 'Answering', or the tool's own name. */
  label: string
  kind: 'thinking' | 'tool' | 'content' | 'fault'
  /**
   * Milliseconds from the turn's start. Absent on a fault the server reported
   * only at the end — we genuinely don't know when it happened, and inventing
   * a timestamp would put it in the wrong place on the timeline.
   */
  at?: number
  /** How long the step ran; absent while it is still open. */
  ms?: number
  /** Only on 'fault' steps. */
  fault?: TurnFault
}

/**
 * What happened during one assistant turn: how long it took, and what it did
 * along the way.
 *
 * `status` is the turn's outcome, which a single error flag can't express:
 * 'recovered' means something went wrong mid-stream but the answer still
 * arrived, so the reader has nothing to act on; 'stopped' means they ended it
 * themselves. Only 'failed' means there is no answer — and only 'failed' sets
 * `Message.error`.
 */
export type TurnTrace = {
  status: 'ok' | 'recovered' | 'stopped' | 'failed'
  /** Epoch ms the turn started; every step's `at` is relative to this. */
  startedAt: number
  /** Total wall time; absent while the turn is still streaming. */
  ms?: number
  model?: string
  tokens?: number
  steps: TurnStep[]
}

/** A reference document the assistant cites with inline [n] markers. */
export type Source = {
  id: number
  title: string
  markdown: string
}

/**
 * One passage to highlight, as character offsets into the source document's
 * markdown. `idx` is a stable per-section id, not a reference — used only as a
 * key.
 */
export type HighlightSection = {
  idx: number
  start: number
  end: number
}

/**
 * The passages of a cited source to highlight. `referenceNumber` is the source
 * id (the [n] marker the chip shows); opening that reference highlights every
 * section here. One source can own several sections.
 */
export type Highlight = {
  referenceNumber: number
  sections: HighlightSection[]
}

export type Message = {
  id: number
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  thinkingActive?: boolean
  thinkingSec?: number
  streaming?: boolean
  /** Assistant message whose stream was interrupted; partial content is kept. */
  stopped?: boolean
  /** User message waiting in the send queue while another turn streams. */
  queued?: boolean
  tools?: ToolCall[]
  sources?: Source[]
  highlights?: Highlight[]
  /** Suggested next prompts, written in the user's voice — picking one sends it verbatim. */
  followups?: string[]
  /** What the turn did and how long it took. Assistant messages only. */
  trace?: TurnTrace
  /**
   * Set only when the turn produced no answer. A recoverable fault is not an
   * error the reader has to act on — it lands on `trace` as a 'fault' step
   * instead, so a turn that stumbled and then answered still reads as answered.
   *
   * Carries the same shape as a recoverable fault, so a fatal error gets a code
   * and a source too.
   */
  error?: TurnFault
}

/** A selectable assistant persona shown in the composer's persona menu. */
export type Persona = {
  id: string
  name: string
  hint: string
}

/** One active filter/facet chip shown in the widget's Filters side panel. */
export type ActiveFilter = {
  id: string
  group: string
  label: string
}

/** One row in the widget's Recent chats side panel. */
export type RecentChat = {
  id: string
  title: string
  snippet: string
  when: string
}

/** A side-rail tab plus its panel, injected into the widget by the host. */
export type SidePanel = {
  id: string
  label: string
  icon: ReactNode
  /** Optional count bubble on the rail icon. */
  badge?: number
  /** Panel header title. */
  title: string
  /** Panel body — a self-contained (optionally stateful) node. */
  content: ReactNode
}
