// The five glyphs the workflow canvas needs that lib/components/icons doesn't
// carry. Same base as the library set — 24px box, 1.8 stroke, round caps — so
// they sit beside CheckIcon and XIcon without looking imported from elsewhere.
import type { IconProps } from '../../../lib/components/icons/types'

function base(props: IconProps): IconProps {
  return {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...props,
  }
}

/** A system call — the plug the node vocabulary uses for deterministic work. */
export const PlugIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0V8ZM12 16v5" />
  </svg>
)

/** A routing decision. */
export const DiamondIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5 20.5 12 12 20.5 3.5 12Z" />
  </svg>
)

/** Where a run starts. */
export const InboxIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 13h4l1.5 3h5L16 13h4" />
    <path d="M6 5h12l2 8v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5l2-8Z" />
  </svg>
)

/** An unassigned person step — a role rather than a name. */
export const PersonIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
)

/** A branch that was not taken. */
export const SkipIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 5.5 15 12l-9 6.5Z" />
    <path d="M18.5 5.5v13" />
  </svg>
)

/** A policy exception called out in the inspector. */
export const FlagIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
  </svg>
)

/** Pause the run. */
export const PauseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 5.5v13M15 5.5v13" />
  </svg>
)

/** Pause's counterpart, for a run that is stopped and can be let go again. */
export const PlayIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7.5 5.5 18 12 7.5 18.5Z" />
  </svg>
)

/** Show or hide the details panel down the right-hand side. */
export const PanelRightIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="M14.5 4.5v15" />
  </svg>
)
