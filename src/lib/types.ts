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
  error?: { message: string; recoverable: boolean }
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
