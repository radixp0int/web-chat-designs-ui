import { useState } from 'react'
import { APP_NAME } from '../config'
import { recentChats } from '../mocks/recentChats'
import {
  ChatIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuIcon,
  SearchIcon,
  XIcon,
  IconButton,
  FacetFilters,
} from '@chat/ui'
import { describeFacetType, FACET_TYPES } from '../mocks/facets'
import { useDemoFacets } from '../useDemoFacets'
import { AccountMenu } from './AccountMenu'

/** How many conversations the rail lists once Recent is expanded. Six fills
 *  the space without pushing the account menu below the fold, and a rail that
 *  scrolls its own history competes with the transcript for the same gesture.
 *
 *  Recent now starts folded: Filters is the section that earns the scroll
 *  area, because a facet list with counts is something you work in, while a
 *  history list is something you glance at. */
const RECENT_LIMIT = 6

type SidebarProps = {
  open: boolean
  /** Desktop-only slim icon-rail state (ignored below the `lg` breakpoint). */
  collapsed: boolean
  onToggleCollapse: () => void
  onClose: () => void
  onNewChat: () => void
  /** The two entries behind the account menu. The host app owns both dialogs,
   *  so the sidebar contributes only the entry points. */
  onOpenUserSettings: () => void
  onOpenFeatureToggles: () => void
}

export function Sidebar({
  open,
  collapsed,
  onToggleCollapse,
  onClose,
  onNewChat,
  onOpenUserSettings,
  onOpenFeatureToggles,
}: SidebarProps) {
  const facets = useDemoFacets()
  const [recentOpen, setRecentOpen] = useState(false)

  return (
    <>
      {/* Mobile scrim */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-scrim/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`glass fixed inset-y-0 left-0 z-40 flex w-72 flex-col rounded-r-xl transition-[transform,width] duration-300 lg:static lg:z-auto lg:translate-x-0 lg:rounded-xl ${
          collapsed ? 'lg:w-16' : 'lg:w-72'
        } ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* The collapsed rail carries nothing but the hamburger: branding and
            the app name belong to the expanded sidebar, and a lone menu button
            reads as "open me" far more plainly than an orb over a chevron. */}
        <div
          className={`flex items-center gap-2.5 px-5 pt-5 pb-4 ${
            collapsed ? 'lg:justify-center lg:px-3' : ''
          }`}
        >
          <span
            className={`orb block size-7 shrink-0 rounded-full ${collapsed ? 'lg:hidden' : ''}`}
            aria-hidden
          />
          <span
            className={`text-lg font-semibold tracking-tight text-ink-strong ${
              collapsed ? 'lg:hidden' : ''
            }`}
          >
            {APP_NAME}
          </span>
          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`hidden rounded-lg p-1.5 text-ink-soft transition hover:bg-panel hover:text-ink-strong lg:block ${
              collapsed ? '' : 'ml-auto'
            }`}
          >
            {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
          </button>
          {/* Mobile close — touch-only, so it takes the 44px variant. */}
          <IconButton
            size="lg"
            shape="rounded"
            onClick={onClose}
            className="ml-auto lg:hidden"
            aria-label="Close sidebar"
          >
            <XIcon />
          </IconButton>
        </div>

        <div className={`px-4 ${collapsed ? 'lg:px-3' : ''}`}>
          <button
            type="button"
            onClick={onNewChat}
            title="New chat"
            className={`flex w-full items-center gap-2.5 rounded-lg bg-panel-solid px-4 py-3 text-sm font-semibold text-ink-strong shadow-sm ring-1 ring-line transition hover:shadow-md hover:ring-accent/40 ${
              collapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <ChatIcon className="shrink-0 text-accent" />
            <span className={collapsed ? 'lg:hidden' : ''}>New chat</span>
          </button>
        </div>

        <nav
          className={`mt-4 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-4 pb-3 ${
            collapsed ? 'lg:px-3' : ''
          }`}
        >
          <SidebarLink icon={<SearchIcon />} label="Search chat" collapsed={collapsed} />

          {/* The section that replaced Library. Everything it needs arrives as
              props — counts, selection, the lookup page — so the library
              component stays host-agnostic and `useDemoFacets` is the only
              piece that would be swapped for real endpoints. */}
          <FacetFilters
            className={collapsed ? '' : 'min-h-0 flex-1'}
            groups={facets.groups}
            selection={facets.selection}
            onSelectionChange={facets.setSelection}
            total={facets.total}
            refreshing={facets.refreshing}
            scope={facets.scope}
            facetTypes={FACET_TYPES}
            describeFacetType={describeFacetType}
            customFacets={facets.customFacets}
            onAddCustomFacet={facets.addCustomFacet}
            onRemoveCustomFacet={facets.removeCustomFacet}
            queries={facets.queries}
            onAddQuery={facets.addQuery}
            onRemoveQuery={facets.removeQuery}
            onSearchGroup={facets.onSearchGroup}
            onLoadMore={facets.onLoadMore}
            onLoadAll={facets.onLoadAll}
            pageSize={facets.pageSize}
            onClearAll={facets.clearAll}
            railCollapsed={collapsed}
            onExpandRail={onToggleCollapse}
          />

          {/* Recent conversations — too detailed for the slim rail, so hidden
              when collapsed, and folded by default now that Filters owns the
              scroll area. A flat list, newest first: grouping by persona
              buried the thing people actually scan for (the conversation's
              title) under a heading they already know, and split six items
              into three stubby groups. */}
          <div className={`shrink-0 border-t border-line pt-1 ${collapsed ? 'lg:hidden' : ''}`}>
            <button
              type="button"
              onClick={() => setRecentOpen((v) => !v)}
              aria-expanded={recentOpen}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-panel"
            >
              {recentOpen ? (
                <ChevronDownIcon width={13} height={13} className="shrink-0 text-ink-soft" />
              ) : (
                <ChevronRightIcon width={13} height={13} className="shrink-0 text-ink-soft" />
              )}
              <span className="flex-1 text-[11px] font-semibold tracking-[0.14em] text-ink-soft uppercase">
                Recent
              </span>
              <span className="text-[11px] text-ink-soft tabular-nums">{recentChats.length}</span>
            </button>

            <ul hidden={!recentOpen}>
              {recentChats.slice(0, RECENT_LIMIT).map(({ id, title, when }) => (
                <li key={id}>
                  <button
                    type="button"
                    title={title}
                    className="group flex w-full items-baseline gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-panel"
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink-soft transition group-hover:text-ink">
                      {title}
                    </span>
                    <span className="shrink-0 text-[11px] text-ink-soft/70">{when}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* One control, not two: the avatar is the entry point to both the
            account dialog and the feature toggles, which is what keeps the slim
            rail down to a single glyph here. */}
        <div className={`border-t border-line px-4 py-3 ${collapsed ? 'lg:px-2.5' : ''}`}>
          <AccountMenu
            collapsed={collapsed}
            onOpenUserSettings={onOpenUserSettings}
            onOpenFeatureToggles={onOpenFeatureToggles}
          />
        </div>
      </aside>
    </>
  )
}

function SidebarLink({
  icon,
  label,
  collapsed,
}: {
  icon: React.ReactNode
  label: string
  collapsed: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-medium text-ink transition hover:bg-panel ${
        collapsed ? 'lg:justify-center' : ''
      }`}
    >
      <span className="shrink-0 text-ink-soft">{icon}</span>
      <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
    </button>
  )
}
