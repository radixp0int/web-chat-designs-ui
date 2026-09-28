// Sample documents for the CodeEditor and DiffViewer specimens on /primitives.
import type { CodeLanguage } from '@chat/ui'

export const codeSamples: Record<CodeLanguage, { file: string; text: string }> = {
  json: {
    file: 'persona.json',
    text: `{
  "persona": "Research assistant",
  "description": "Answers from approved sources and cites them.",
  "model": "default",
  "temperature": 0.2,
  "streaming": true,
  "tools": ["search", "cite", "summarize"],
  "citations": {
    "style": "inline",
    "maxPerAnswer": 6
  },
  "handoff": null,
  "starters": [
    "Summarize this policy",
    "Compare two documents",
    "What changed recently?"
  ]
}`,
  },
  yaml: {
    file: 'chat-widget.config.yml',
    text: `# chat-widget.config.yml
widget:
  theme: default
  mode: auto          # light | dark | auto
  launcher:
    position: bottom-right
    label: "Ask a question"
  composer:
    placeholder: Ask anything…
    maxLength: 2000
    attachments: false

retrieval:
  sources:
    - policies
    - product-guides
  topK: 5
  citations: inline`,
  },
  csv: {
    file: 'team-budget.csv',
    text: `"name","department","budget","active"
"Ada Lovelace","Research, Applied","125000","true"
"Grace Hopper","Platform","98000","true"
"Katherine Johnson","Operations","112500","false"`,
  },
  text: {
    file: 'system-prompt.txt',
    text: `You are a research assistant for internal teams.

Answer only from the approved sources you are given, and cite
each claim with the source it came from. If the sources don’t
cover the question, say so plainly and suggest who to ask.

Keep answers short: lead with the answer, then the detail.`,
  },
}

export const diffSample = {
  file: 'team-budget.csv',
  original: `"name","department","budget","active"
"Ada Lovelace","Research, Applied","125000","true"
"Grace Hopper","Platform","98000","true"
"Katherine Johnson","Operations","112500","false"`,
  modified: `name,department,budget,active
Ada Lovelace,"Research, Applied",140000,true
Grace Hopper,Platform,98000,true
Margaret Hamilton,Engineering,135000,true
Katherine Johnson,Operations,112500,true`,
}
