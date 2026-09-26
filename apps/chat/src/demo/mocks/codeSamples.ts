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
  file: 'chat-widget.config.yml',
  original: `# chat-widget.config.yml
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

personas:
  default:
    name: Research assistant
    tone: concise
    starters:
      - Summarize this policy
      - Compare two documents
      - What changed recently?
  support:
    name: Support guide
    tone: friendly
    handoff: live-agent

retrieval:
  sources:
    - policies
    - product-guides
  topK: 5
  citations: inline

telemetry:
  enabled: true
  sampleRate: 0.1`,
  modified: `# chat-widget.config.yml
widget:
  theme: aristotle2
  mode: auto          # light | dark | auto
  launcher:
    position: bottom-right
    label: "Ask the assistant"
  composer:
    placeholder: Ask anything…
    maxLength: 4000
    attachments: true
    allowedTypes:
      - pdf
      - docx

personas:
  default:
    name: Research assistant
    tone: concise
    starters:
      - Summarize this policy
      - Compare two documents
      - What changed recently?
  support:
    name: Support guide
    tone: friendly
    handoff: live-agent

retrieval:
  sources:
    - policies
    - product-guides
    - faqs
  topK: 8
  citations: footnote

telemetry:
  enabled: true
  sampleRate: 0.1
  retention: 30d`,
}
