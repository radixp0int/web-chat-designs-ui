export const personas = [
  { id: 'concierge', name: 'Concierge', hint: 'Warm, guided answers' },
  { id: 'analyst', name: 'Analyst', hint: 'Numbers first, cited' },
  { id: 'concise', name: 'Concise', hint: 'Short and direct' },
  { id: 'creative', name: 'Creative', hint: 'Ideas and drafts' },
] as const

export type PersonaId = (typeof personas)[number]['id']
