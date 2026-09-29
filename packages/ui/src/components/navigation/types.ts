import type { MouseEvent, ReactNode } from 'react'

export type NavigationDestination = {
  /** Stable unique key, shared with the router and pinned IDs. */
  id: string
  /** Human-readable destination name; also labels icon-only links. */
  label: string
  /** Real route, preserving open-in-new-tab and link-copy behavior. */
  href: string
  /** Decorative glyph used in the rail and quick menu. */
  icon: ReactNode
  /** Additional search terms, such as legacy page names. */
  keywords?: string[]
}

export type NavigationSection = {
  /** Stable, unique section key. */
  id: string
  /** Context sidebar heading and quick-menu category. */
  label: string
  /** Ordered destinations; IDs must be unique across all sections. */
  destinations: NavigationDestination[]
}

export type NavigationMode = 'expanded' | 'rail' | 'hidden'

export type NavigationProps = {
  /** Expanded section links, pinned rail only, or no navigation during a focused flow. Defaults to expanded. */
  mode?: NavigationMode
  /** Optional controlled collapse toggle. Hidden mode is owned by the page, never by this toggle. */
  onModeChange?: (mode: NavigationMode) => void
  /** Available destinations, already filtered by the host's permissions. */
  sections: NavigationSection[]
  /** Current route. Selecting it again never deselects it. */
  activeId: string
  /** Ordered shortcuts. Unknown IDs are ignored. The host owns persistence. */
  pinnedIds: string[]
  /** Reports the complete next ordered list when a pin is toggled. */
  onPinnedIdsChange: (ids: string[]) => void
  /** Optional client-side router adapter. Prevent default here when handling a route. Modified clicks bypass this callback. */
  onNavigate?: (destination: NavigationDestination, event: MouseEvent<HTMLAnchorElement>) => void
  /** Controlled quick-menu visibility. */
  menuOpen: boolean
  /** Requests opening or closing the quick menu. */
  onMenuOpenChange: (open: boolean) => void
  /** Additional styles for the rail and context sidebar wrapper. */
  className?: string
}
