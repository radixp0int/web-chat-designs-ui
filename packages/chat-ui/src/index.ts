// Public API for the chat UI library. The demo app imports from here (and from
// deep paths where convenient); an external consumer would use only this barrel.
// The generic layer it builds on — primitives, icons, overlays, settings
// plumbing — is @chat/ui, imported from there rather than re-exported here.

// Engine + streaming contract
export * from './engine/chatEngine'
export * from './engine/wsResponder'
export * from './engine/wsProtocol'

// Hooks
export * from './hooks/useChat'
export * from './hooks/useSpeechRecognition'
export * from './hooks/useHighlights'

// Settings — the data-driven feature gate (the catalogue and persistence are @chat/ui)
export * from './settings'

// Context + shared types
export * from './branding'
export * from './citations'
export * from './types'
export * from './highlights'

// Components — one folder per component (index.ts, <name>.tsx, types.ts)
export * from './components/message-actions'
export * from './components/asked-over'
export * from './components/markdown'
export * from './components/citation-chip'
export * from './components/source-strip'
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
export * from './components/recent-chats-panel'
export * from './components/persona-panel'

// Widget shell
export * from './widget/ChatWidget'
export * from './widget/WidgetPanel'
export * from './widget/useHostTheme'
export * from './widget/mount'
