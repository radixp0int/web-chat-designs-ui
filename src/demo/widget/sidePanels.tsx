import { useState } from 'react'
import { FiltersPanel } from '../../lib/components/filters-panel'
import { PersonaPanel } from '../../lib/components/persona-panel'
import { RecentChatsPanel } from '../../lib/components/recent-chats-panel'
import { demoFilters, demoPromptTemplates, demoRecentChats } from '../mocks/sideTabData'
import { personas } from '../personas'

// Self-contained stateful wrappers: the widget renders these inside its own
// tree, so their state lives with the widget (the imperative mount has no
// outer React parent to hold it). UI only for now.

export function DemoFiltersPanel() {
  const [filters, setFilters] = useState(demoFilters)
  return (
    <FiltersPanel
      filters={filters}
      onRemove={(id) => setFilters((f) => f.filter((x) => x.id !== id))}
      onClear={() => setFilters([])}
    />
  )
}

export function DemoRecentChatsPanel() {
  const [activeId, setActiveId] = useState(demoRecentChats[0].id)
  return <RecentChatsPanel chats={demoRecentChats} activeId={activeId} onSelect={setActiveId} />
}

export function DemoPersonaPanel() {
  // Only the persona is stateful — the prompt stack is read-only here.
  const [personaId, setPersonaId] = useState(personas[0].id)
  return (
    <PersonaPanel
      personas={personas}
      personaId={personaId}
      onPersonaChange={setPersonaId}
      templates={demoPromptTemplates}
    />
  )
}
