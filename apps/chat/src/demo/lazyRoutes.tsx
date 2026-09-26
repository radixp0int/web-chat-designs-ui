import { lazy } from 'react'

// The landing page is the only eager page. Each demo carries enough UI that it
// should be fetched only when its route is opened, rather than making every
// visitor download all four demos up front.
export const ChatPage = lazy(() => import('./App.tsx'))
export const WidgetDemoPage = lazy(() =>
  import('./pages/WidgetDemoPage.tsx').then((module) => ({
    default: module.WidgetDemoPage,
  })),
)

// Unlisted workbench for @chat/ui's core primitives. Deliberately absent from
// the landing page — reachable only by typing /primitives.
export const PrimitivesPage = lazy(() =>
  import('./pages/PrimitivesPage.tsx').then((module) => ({
    default: module.PrimitivesPage,
  })),
)
export const DataTablePage = lazy(() =>
  import('./pages/DataTablePage.tsx').then((module) => ({
    default: module.DataTablePage,
  })),
)

export function RoutePending() {
  return (
    <div
      role="status"
      className="grid min-h-dvh place-items-center bg-canvas text-sm text-ink-soft"
    >
      Loading demo…
    </div>
  )
}
