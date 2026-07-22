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

// Context + shared types
export * from './branding'
export * from './citations'
export * from './uiSize'
export * from './types'
export * from './highlights'

// Components — one folder per component (index.ts, <name>.tsx, types.ts)
export * from './components/icons'
export * from './components/icon-button'
export * from './components/markdown'
export * from './components/citation-chip'
export * from './components/source-strip'
export * from './components/thinking-block'
export * from './components/tool-call-chip'
export * from './components/chat-message'
export * from './components/persona-menu'
export * from './components/composer'
export * from './components/reference-panel'
export * from './components/side-tabs'
export * from './components/filters-panel'
export * from './components/recent-chats-panel'
export * from './components/resizable-column'
export * from './components/resize-handle'

// Widget shell
export * from './widget/ChatWidget'
export * from './widget/WidgetPanel'
export * from './widget/useHostTheme'
export * from './widget/mount'
