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

// Context + shared types
export * from './branding'
export * from './citations'
export * from './uiSize'
export * from './types'

// Components
export * from './components/Icons'
export * from './components/IconButton'
export * from './components/Markdown'
export * from './components/CitationChip'
export * from './components/SourceStrip'
export * from './components/ThinkingBlock'
export * from './components/ToolCallChip'
export * from './components/ChatMessage'
export * from './components/PersonaMenu'
export * from './components/Composer'
export * from './components/ReferencePanel'
export * from './components/SideTabs'
export * from './components/FiltersPanel'
export * from './components/RecentChatsPanel'

// Widget shell
export * from './widget/ChatWidget'
export * from './widget/WidgetPanel'
export * from './widget/useHostTheme'
export * from './widget/mount'
