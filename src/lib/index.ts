// Public API for the chat UI library. The demo app imports from here (and from
// deep paths where convenient); an external consumer would use only this barrel.

// Engine + streaming contract
export * from './engine/chatEngine'
export * from './engine/wsResponder'
export * from './engine/wsProtocol'

// Hooks
export * from './hooks/useChat'
export * from './hooks/useSpeechRecognition'
export * from './hooks/useAutoGrowTextarea'
export * from './hooks/useHighlights'
export * from './hooks/useStickToBottom'
export * from './hooks/useWheelToHorizontal'
export * from './hooks/useHoverCard'
export * from './hooks/useOverlayLayer'
export * from './hooks/useDismissableTip'

// Settings — feature catalogue, persistence, and the data-driven gate
export * from './settings'

// Context + shared types
export * from './branding'
export * from './citations'
export * from './overlay'
export * from './uiSize'
export * from './types'
export * from './highlights'

// Components — one folder per component (index.ts, <name>.tsx, types.ts)
export * from './components/icons'
export * from './components/icon-button'
export * from './components/copy-button'
export * from './components/count-badge'
export * from './components/filter-chip'
export * from './components/message-actions'
export * from './components/asked-over'
export * from './components/markdown'
export * from './components/citation-chip'
export * from './components/hover-card'
export * from './components/source-strip'
export * from './components/inline-tip'
export * from './components/followup-chips'
export * from './components/thinking-block'
export * from './components/tool-call-chip'
export * from './components/turn-trace'
export * from './components/chat-message'
export * from './components/persona-menu'
export * from './components/suggestions'
export * from './components/composer'
export * from './components/queue-dock'
export * from './components/reference-panel'
export * from './components/side-tabs'
export * from './components/facet-filters'
export * from './components/recent-chats-panel'
export * from './components/persona-panel'
export * from './components/settings'
export * from './components/resizable-column'
export * from './components/resize-handle'
export * from './components/scroll-to-bottom-button'

// Widget shell
export * from './widget/ChatWidget'
export * from './widget/WidgetPanel'
export * from './widget/useHostTheme'
export * from './widget/mount'
