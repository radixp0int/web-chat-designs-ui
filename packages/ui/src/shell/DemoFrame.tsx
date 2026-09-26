// The shell every demo route sits inside. Its whole job is the bookmark: a
// rounded tab parked off the left edge that slides out on hover and goes home.
//
// One copy, because the pages had two different answers to the same question —
// a footer link in the workflow sidebar, a nav item on the widget's host site —
// and /chat had none at all. Mount it once around the routes (a layout route passing `<Outlet />` as
// children) so a new demo route inherits the way home by being listed, not by
// remembering to wrap it. The styling lives in `.demo-marker` (ui.css); see
// there for why it is not utilities.
//
// A plain <a>, not a router link: home is a different origin for any app but
// the one with the landing page, and a router link to a path that app does
// not route renders a blank page. It also keeps a router out of this package.
import type { ReactNode } from 'react'
import { ChevronLeftIcon } from '../components/icons'

export type DemoFrameProps = {
  /** Where "Back to Demos" goes. */
  homeHref: string
  children: ReactNode
}

export function DemoFrame({ homeHref, children }: DemoFrameProps) {
  return (
    <>
      {children}
      {/* Left edge, centred. Centred because the theme toggle owns every page's
          top-right corner and, high on either side, the tab collided with page
          chrome — on /workflow-demo with the inspector's "Needs approval"
          badge, which is the same ember hue. The middle is clear of that and of
          the decision buttons at the bottom. `.demo-marker` owns `top`, and
          moves it up out of the composer's way on touch.

          z-20 keeps it under the mobile slide-overs (z-30 scrim, z-40 panel),
          which should cover it while they are open.

          No aria-label: the label is opacity-0 at rest, not display-none, so it
          is still the link's accessible name. */}
      <a
        href={homeHref}
        title="Back to Demos"
        className="demo-marker fixed left-0 z-20 flex h-11 items-center gap-2 pr-6 pl-4 text-[14px] font-bold tracking-[0.012em] whitespace-nowrap"
      >
        <ChevronLeftIcon width={14} height={14} className="demo-marker-label shrink-0 text-white" />
        <span className="demo-marker-label text-white text-semibold">
          {/* Touch parks the tab open, so on a phone this is permanent
              furniture and earns less of the edge. */}
          <span className="max-sm:hidden">Back to </span>Demos
        </span>
      </a>
    </>
  )
}
