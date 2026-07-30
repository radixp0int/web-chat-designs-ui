/**
 * Diagram corpus for the renderer bake-off.
 *
 * `common` — the six types every candidate claims to support; this is the
 *   fidelity comparison.
 * `probe`  — types beautiful-mermaid does not implement. They are meant to
 *   fail there, so the coverage gap is visible instead of hidden.
 * `realistic` — the shape an LLM actually emits: quoted labels, <br/>,
 *   subgraphs, emoji. Where parsers diverge in practice.
 */
export type SampleKind = 'common' | 'probe' | 'realistic'

export type Sample = {
  id: string
  title: string
  kind: SampleKind
  code: string
}

export const SAMPLES: Sample[] = [
  {
    id: 'flowchart-td',
    title: 'Flowchart (TD)',
    kind: 'common',
    code: `flowchart TD
  A[User asks a question] --> B{Needs a tool?}
  B -->|Yes| C[Call retrieval]
  B -->|No| D[Answer directly]
  C --> E[Rank sources]
  E --> F[Compose answer]
  D --> F
  F --> G[Stream to client]`,
  },
  {
    id: 'flowchart-lr',
    title: 'Flowchart (LR)',
    kind: 'common',
    code: `flowchart LR
  Client --> Gateway
  Gateway --> Auth
  Gateway --> Chat
  Chat --> Model
  Chat --> Cache
  Cache --> Chat
  Model --> Chat
  Chat --> Client`,
  },
  {
    id: 'sequence',
    title: 'Sequence',
    kind: 'common',
    code: `sequenceDiagram
  participant U as User
  participant W as Widget
  participant S as WS Server
  participant M as Model
  U->>W: types a message
  W->>S: send(message)
  S->>M: completion request
  M-->>S: token stream
  S-->>W: delta frames
  W-->>U: renders progressively
  Note over W,S: reconnects resume the stream`,
  },
  {
    id: 'class',
    title: 'Class',
    kind: 'common',
    code: `classDiagram
  class Message {
    +string id
    +Role role
    +string text
    +Source[] sources
    +render() void
  }
  class Source {
    +number id
    +string title
    +string url
  }
  class Conversation {
    +Message[] messages
    +append(m) void
  }
  Conversation "1" --> "*" Message
  Message "1" --> "*" Source`,
  },
  {
    id: 'state',
    title: 'State',
    kind: 'common',
    code: `stateDiagram-v2
  [*] --> Idle
  Idle --> Connecting: send()
  Connecting --> Streaming: first token
  Connecting --> Failed: timeout
  Streaming --> Idle: done
  Streaming --> Failed: socket drop
  Failed --> Connecting: retry
  Failed --> [*]: give up`,
  },
  {
    id: 'er',
    title: 'ER',
    kind: 'common',
    code: `erDiagram
  USER ||--o{ CONVERSATION : starts
  CONVERSATION ||--o{ MESSAGE : contains
  MESSAGE ||--o{ CITATION : references
  CITATION }o--|| DOCUMENT : points_to
  USER {
    string id
    string email
  }
  MESSAGE {
    string id
    string role
    string body
  }`,
  },
  {
    id: 'xychart',
    title: 'XY chart',
    kind: 'common',
    code: `xychart-beta
  title "Tokens per second"
  x-axis [p50, p75, p90, p95, p99]
  y-axis "tok/s" 0 --> 120
  bar [104, 96, 81, 64, 38]
  line [104, 96, 81, 64, 38]`,
  },

  {
    id: 'gantt',
    title: 'Gantt',
    kind: 'probe',
    code: `gantt
  title Rollout
  dateFormat YYYY-MM-DD
  section Build
    Renderer spike     :a1, 2026-07-01, 7d
    Integration        :a2, after a1, 10d
  section Ship
    Widget bundle diet :a3, after a2, 5d
    Launch             :milestone, after a3, 0d`,
  },
  {
    id: 'pie',
    title: 'Pie',
    kind: 'probe',
    code: `pie title Message types
  "Plain prose" : 62
  "Code blocks" : 21
  "Tables" : 11
  "Diagrams" : 6`,
  },
  {
    id: 'mindmap',
    title: 'Mindmap',
    kind: 'probe',
    code: `mindmap
  root((chat ui))
    rendering
      markdown
      diagrams
      citations
    transport
      websocket
      resume
    surfaces
      full page
      widget`,
  },
  {
    id: 'gitgraph',
    title: 'Git graph',
    kind: 'probe',
    code: `gitGraph
  commit id: "init"
  branch mermaid-lab
  checkout mermaid-lab
  commit id: "add renderers"
  commit id: "streaming sim"
  checkout main
  merge mermaid-lab
  commit id: "ship"`,
  },
  {
    id: 'journey',
    title: 'User journey',
    kind: 'probe',
    code: `journey
  title Asking a question
  section Discover
    Open widget: 5: User
    Read starters: 4: User
  section Ask
    Type question: 3: User
    Wait for stream: 2: User
  section Verify
    Open citation: 5: User`,
  },

  {
    id: 'realistic',
    title: 'LLM-style flowchart',
    kind: 'realistic',
    code: `flowchart TB
  subgraph ingest["📥 Ingest"]
    A["Upload docs<br/>(PDF, MD, HTML)"] --> B["Chunk & embed"]
    B --> C[("Vector store")]
  end
  subgraph serve["⚡ Serve"]
    D["User question"] --> E{"Confidence<br/>above threshold?"}
    E -- "yes" --> F["Answer from context"]
    E -- "no" --> G["Retrieve top-k"]
    G --> C
    C --> H["Re-rank"]
    H --> F
  end
  F --> I["Attach citations [1..n]"]
  I --> J["Stream to client"]
  style C fill:#e0f2fe,stroke:#0284c7`,
  },
]

export const SAMPLES_BY_ID = new Map(SAMPLES.map((s) => [s.id, s]))
