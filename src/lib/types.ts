import type { ReactNode } from 'react'

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
