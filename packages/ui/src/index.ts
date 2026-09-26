// @chat/ui — the generic layer: primitives, icons, overlays, settings plumbing,
// and the demo shell. Nothing here knows about chat, and nothing here may
// import a chat module; @chat/chat-ui builds on this, never the reverse.

// Core primitives — brand-agnostic (buttons, inputs, tables, paging)
export * from './core'

// Components — one folder per component (index.ts, <name>.tsx, types.ts)
export * from './components/icons'
export * from './components/icon-button'
export * from './components/copy-button'
export * from './components/count-badge'
export * from './components/filter-chip'
export * from './components/facet-filters'
export * from './components/inline-tip'
export * from './components/hover-card'
export * from './components/side-tabs'
export * from './components/resizable-column'
export * from './components/resize-handle'
export * from './components/scroll-to-bottom-button'
export * from './components/settings'

// Hooks
export * from './hooks/useStickToBottom'
export * from './hooks/useHoverCard'
export * from './hooks/useWheelToHorizontal'
export * from './hooks/useResizablePanel'
export * from './hooks/useAutoGrowTextarea'
export * from './hooks/useOverlayLayer'
export * from './hooks/useDismissableTip'

// Settings — feature catalogue, persistence, palettes and highlight swatches
export * from './settings'

// Overlay stacking, sizing, key names
export * from './overlay'
export * from './uiSize'
export * from './keyLabels'

// Demo shell — the page chrome every app in this repo shares
export * from './shell/AmbientGlow'
export * from './shell/ThemeToggle'
export * from './shell/DemoFrame'
