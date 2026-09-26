# chat-interfaces

A **brand-agnostic chat component library** (`src/lib`) — the thing this repo
exists to produce — plus a **demo app** (`src/demo`) that consumes it as the
fictional "Aristotle" finance assistant. The library is the product; the demo is
how you look at it. React 19 + Vite + Tailwind v4.

Nothing in `src/lib` imports from `src/demo`. The product name arrives through a
`BrandingProvider`, suggestions / starters / side panels are props, the widget shell
takes its responder and content from the host, and every colour resolves through
a theme class (see [Theming](#theming)). Point those five things at a different
brand and the same library is a different product.

---

## The library

`src/lib/index.ts` is the public barrel. Everything below is exported from it.

### Components

One folder per component — `index.ts`, `<name>.tsx`, `types.ts`.

**Conversation**

| Component       | What it is                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ChatMessage`   | One turn. Composes the thinking block, tool chips, markdown body, source strip, trace handle, and action row.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `Markdown`      | GFM renderer that rewrites `[n]` markers into `CitationChip`s. Only numbers matching a real source id are rewritten, so `[sic]` passes through; a half-received trailing `[12` is hidden mid-stream so it never flickers as plain text.                                                                                                                                                                                                                                                                                                                                                                                      |
| `ThinkingBlock` | The collapsible reasoning panel above an answer — shimmering "Thinking…" while active, "Reasoning paused" while stepped aside for a tool call, and "Thought for Ns" only once reasoning has genuinely finished.                                                                                                                                                                                                                                                                                                                                                                                                              |
| `ToolCallChip`  | One tool call as a status chip — pulsing while running, check when done, red with the reason when it fails. Finished calls expand to their input/output JSON.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `Composer`      | The input: auto-growing textarea, expand toggle, attachments, hold-to-speak mic, persona menu, send/stop. `Enter` queues while streaming; while a draft is typed mid-stream, the primary button becomes one Queue action with a hover/focus/long-press menu naming both verbs (`Queue`/`Send now`) and their keys.                                                                                                                                                                                                                                                                                                           |
| `QueueDock`     | The send queue, parked on the composer's lip rather than in the transcript — so a streaming answer can't push a queued message down the page. Next-up gets the full row (send now, edit, drag-to-reorder, overflow menu); the rest collapse to one line, each carrying its own remove button — only the first keeps that in the menu. Pause/Resume and Clear all live in its header, Resume filled as the one way out of a paused queue; given `chain` controls it also builds and runs a queue of questions; a collapse control folds it to one line. Nothing about the dock is persisted — a reload starts empty and open. |
| `FollowupChips` | Suggested next prompts, drawn as branches off the answer above them — a hairline spine through the orb gutter with a node per chip.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `PersonaMenu`   | Persona picker; labelled pill, or icon-only when compact. The labelled pill also collapses to an icon-only circle on its own — a `@container` query on `Composer`'s wrapper, independent of the `compact` prop — once the row is squeezed too narrow for it.                                                                                                                                                                                                                                                                                                                                                                 |

**Citations**

| Component        | What it is                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CitationChip`   | An inline `[n]` marker as a small clickable chip. The superscript is a translate rather than `<sup>`, so line-height stays stable. On hover or keyboard focus it raises a preview card showing the passage it cites — the text the reference panel would highlight — so checking a citation doesn't cost your place in the answer. |
| `SourceStrip`    | Compact row of numbered source pills under an answer.                                                                                                                                                                                                                                                                              |
| `ReferencePanel` | The reader: one reference document with prev/next, a numbered pill rail, and arrow keys — jumping from reference 2 to 21 is one gesture. A wheel mouse scrolls the rail sideways (`useWheelToHorizontal`).                                                                                                                         |
| `HoverCard`      | Generic anchored card, portalled out of whatever is clipping it. Owns placement (above by default, flips and clamps to fit) and stays open while the pointer is on it. Knows nothing about citations.                                                                                                                              |

**Turn status**

| Component          | What it is                                                                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TurnTraceHandle`  | The `2.4s` duration at the right of the action row; opens the timeline.                                                                                                      |
| `TurnTracePanel`   | The timeline itself — every phase of the turn with its stamp. Columns are headed `Start / Step / Took`, so the two numbers on a row can't be read as the same kind of thing. |
| `TurnTraceFailure` | The failed turn's whole body: frayed rail, verdict, `Retry`.                                                                                                                 |

See [Turn status and errors](#turn-status-and-errors) for the design rule these
three encode.

**Layout and chrome**

| Component                      | What it is                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SideTabRail` / `SideTabPanel` | Vertical icon rail with slide-in panels. Generic — a tab is an id + icon + label (+ optional count badge), and the host supplies the panel content.                                                                                                                                                                                                                                           |
| `ResizableColumn`              | A right-hand column with a drag handle on its left edge, for splitting a card into chat + document panes. Clamps so the sibling column keeps `minRemainder` px. Used by both the demo's reference pane and the widget's split view.                                                                                                                                                           |
| `ResizeHandle`                 | The grip itself. Presentational only — state lives in `useResizablePanel`.                                                                                                                                                                                                                                                                                                                    |
| `ScrollToBottomButton`         | The "New messages" pill shown once the reader scrolls away from a stream. Presentational only — visibility and the scroll itself come from `useStickToBottom`. Used by both `ConversationView` (demo) and `WidgetPanel`.                                                                                                                                                                      |
| `IconButton`                   | Fixed hit boxes, not padding: `sm` 32 (clears WCAG 2.2 SC 2.5.8), `md` 36, `lg` 44 (Apple HIG touch minimum). The glyph can stay as small as the design wants.                                                                                                                                                                                                                                |
| `FacetFilters`                 | The Filters section of a side rail: a scope control, hand entry, the active chips and the counted facet groups. Controlled — it fetches nothing, counts nothing and stores nothing, so a live `/facets` endpoint and a fixture satisfy the same props. `density` covers the widget's shorter panel; the thresholds in `facetRules.ts` decide when a group stops listing and becomes a lookup. |
| `AskedOverStrip`               | What a question was asked over, recorded on the question. A snapshot, never a view: it draws only the `scope` it was given, and takes the host's `current` chips purely to decide “changed since” — pass `[]` when nothing is set, omit it when the host does not track scope.                                                                                                                |
| `CopyButton`                   | Copy to clipboard with its own confirmation. The glyph swap is invisible to a screen reader, so a polite live region says “Copied” as well; the revert timer is cleared on unmount.                                                                                                                                                                                                           |
| `CountBadge`                   | A count in a pill: one digit is a circle, more widen it, and past `max` (99) it reads “99+”. The `corner` placement anchors on its left edge so extra digits grow away from the glyph rather than over it, and sits above side panels so the “+” is never painted out.                                                                                                                        |
| `FilterChip`                   | One filter as a chip, in three shapes: `value` (the index vouched for it), `query` (a predicate standing in for a selection too large to list) and `custom` (typed by hand, dashed because it has no count). Removable when given `onRemove`. Shared by `FacetFilters` and `AskedOverStrip`, so neither imports the other.                                                                    |
| `MessageActions`               | The row of controls under a message. `reveal` hides it with opacity rather than `display`, so it keeps its place in the tab order and the transcript does not jump when a pointer crosses it (`.message-actions`, lib/styles.css).                                                                                                                                                            |
| `FeatureToggles`               | The switch list for a `FeatureCatalogue` — sections, headings, descriptions, rows. Data-driven and presentational: no dialog, no reset. An empty section renders nothing, so one catalogue can be filtered per tenant. See the [recipe](#recipe-user-toggleable-features).                                                                                                                    |
| `PalettePicker`                | Pick a `chat-theme-*` palette. Each tile previews that theme's dark canvas, panel and action fill. `title` / `description` are props so a tenant can retitle it.                                                                                                                                                                                                                              |
| `HighlightPicker`              | Pick the `<mark>` colour behind a cited passage, from brand.css §5. Same `title` / `description` props.                                                                                                                                                                                                                                                                                       |
| `RecentChatsPanel`             | Recent conversations to switch between. Presentational — selection is UI-only.                                                                                                                                                                                                                                                                                                                |
| `PersonaPanel`                 | Persona select plus the stacked prompt templates in force. Ordered by each layer's `priority` field, not by array order. The textareas are `readOnly` rather than `disabled`, so the text stays selectable and keyboard-reachable.                                                                                                                                                            |
| Icons                          | 47 stroke icons as React components (`SendIcon`, `SparkleIcon`, …), all taking `width`/`height`/`className`.                                                                                                                                                                                                                                                                                  |

**Widget shell**

| Export         | What it is                                                                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ChatWidget`   | The floating launcher plus the pop-in panel. Chat state lives here, and the panel is hidden with CSS rather than unmounted — the conversation and draft survive closing and reopening. Owns the launcher's three states (see [The launcher](#the-launcher)). |
| `WidgetPanel`  | The panel's interior: header, greeting, conversation, composer, side tabs, split reference view.                                                                                                                                                             |
| `mountWidget`  | Mounts `ChatWidget` into a shadow root and returns an `open`/`close`/`setTheme`/`destroy` handle.                                                                                                                                                            |
| `useHostTheme` | Follows the host page's `dark` class / OS preference when the widget runs in `auto`.                                                                                                                                                                         |

### Engine

The streaming contract, in `src/lib/engine/`.

- **`Responder`** — `(prompt, signal) => AsyncGenerator<ChatEvent>`. The single
  seam between the UI and whatever produces text. `ChatEvent` covers `thinking`,
  `thinking-done`, `content`, `done`, `tool`, `sources`, `followups`, and
  `error`.
- **`createCannedResponder(turns)`** — replays scripted turns word by word.
- **`createWsResponder(url)`** — talks to the mock WebSocket server. Each send
  opens a fresh socket; aborting closes it, which the server treats as a cancel.
  Failures never throw — they arrive as `{type:'error'}` events so the UI renders
  them in the conversation.
- **`wsProtocol.ts`** — the wire types. **A verbatim copy of
  `chat-ws-server/src/types.ts`; keep the two in sync.**

Swapping in a real streaming API means writing one `Responder`. No component
changes.

### Hooks

| Hook                   | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useChat(responder)`   | Owns the conversation _and_ the send queue as two separate pieces of state — `messages` holds only turns that have actually started, `queue` holds what's waiting. Returns `{ messages, busy, queue, held, chain, send, sendNow, stop, hold, resume, retry, editQueued, moveQueued, sendQueuedNow, removeQueued, clearQueue, reset }` (`chain` is a `ChainControls` object: `state, start, add, run, cancel`), and derives each turn's `TurnTrace` from the event stream. A user turn is appended to `messages` once, at the moment it starts running, and never moves within it again — the invariant that keeps the transcript from jumping under a streaming answer. |
| `useSpeechRecognition` | Wraps the browser Speech Recognition API as press-and-hold — `start` on the way down, `stop` on the way up, so a microphone cannot be left open by forgetting it. `onResult` receives the whole passage heard so far, not the latest phrase, so callers replace rather than append. `supported` is `false` where the API is missing, so callers hide the control entirely.                                                                                                                                                                                                                                                                                              |
| `useAutoGrowTextarea`  | Grows a textarea with its content up to the active cap, recomputing on resize when expanded.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `useHighlights`        | Memoized highlight ranges for the active reference, resolved against the doc text.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `useResizablePanel`    | Owns a panel's width and the pointer-drag lifecycle. The caller supplies `computeWidth(clientX)`, so the hook stays layout-agnostic. Works inside the widget's shadow root.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `useWheelToHorizontal` | Lets a wheel mouse scroll a horizontally-overflowing strip. Attaches its own non-passive listener, because React registers `wheel` as passive on the root and a synthetic `onWheel` can't `preventDefault`. Falls through at either end so the gesture continues into the page.                                                                                                                                                                                                                                                                                                                                                                                         |
| `useHoverCard`         | Open/close for a hover card, to WCAG 2.2 SC 1.4.13 — hoverable (the pointer can travel onto the card), dismissible (Escape, captured so it doesn't also close what's behind), persistent (no auto-dismiss). Ignores touch, where `:hover` sticks after a tap.                                                                                                                                                                                                                                                                                                                                                                                                           |
| `useOverlayLayer`      | The node a portalled overlay renders into, resolved from its anchor. See `overlay.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `useStickToBottom`     | Keeps a scroll region pinned to its bottom edge while `contentRef` grows, but only while the reader hasn't scrolled away — tracked via `ResizeObserver`, no app types. Pairs with `ScrollToBottomButton`.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `useFeatureFlags`      | On/off state for a `FeatureCatalogue`, hydrated from and persisted to a required `storageKey` (or a custom `storage`). Merges stored values over defaults, and drops stored values for ids the catalogue no longer lists — which is what stops a revoked feature coming back from the viewer's own localStorage.                                                                                                                                                                                                                                                                                                                                                        |
| `useStoredChoice`      | One persisted choice from a fixed set (the palette, the highlight swatch). Validates against what is currently offered, so a retired option falls back instead of applying a class nothing defines.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `usePaletteClass`      | Applies `chat-theme-<id>` to `<html>` (or a given element — the widget's root is its own theme scope), removing whichever palette class was there before.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

`useResizablePanel` is the one hook **not** re-exported from `src/lib/index.ts` —
it reaches consumers through `ResizableColumn`. Import it by deep path if you
need it directly.

### Injected context and shared types

| Module          | What it carries                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `branding.ts`   | `BrandingProvider` — `appName`, `modelName`, `disclaimer`. The library has no baked-in brand.                                                                                                                                                                                                                                                                                                                                                                                                    |
| `citations.ts`  | `CitationsProvider` — lets a chip deep inside a message open the reference frame owned by the surface, without prop drilling. Defaults to a no-op, so `ChatMessage` renders fine outside a provider.                                                                                                                                                                                                                                                                                             |
| `overlay.ts`    | `OverlayContainerProvider` — where portalled overlays land. Unset, the layer is resolved from the anchor: inside the widget's shadow root (its stylesheet lives there, and the dialog's transform would capture `position: fixed`), else `document.body` (out of `.glass`'s backdrop-filter, which makes `<main>` clip fixed children). The layer restates its own theme class rather than inheriting one. An app with its own hover-container portal supplies it here and nothing else changes. |
| `uiSize.ts`     | `UiSizeProvider` — `'default'` or `'compact'`. The widget wraps its tree in `compact` to shrink fonts, paddings, and controls without touching a single call site.                                                                                                                                                                                                                                                                                                                               |
| `types.ts`      | `Message`, `TurnTrace`, `TurnStep`, `TurnFault`, `ToolCall`, `Source`, `Highlight`, `Persona`, `AskedOverScope`, `RecentChat`, `PromptTemplate`, `SidePanel`.                                                                                                                                                                                                                                                                                                                                    |
| `highlights.ts` | Resolving highlight phrases to character offsets in source markdown, and rendering those passages as plain text for a citation's hover preview.                                                                                                                                                                                                                                                                                                                                                  |
| `brand.css`     | Every colour value, as swappable themes.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `styles.css`    | Tailwind wiring, base layer, and the `.glass` / `.orb` / `.turn-rail` / `.highlight-wash` / `.launcher-label` / `.shimmer-text` utilities.                                                                                                                                                                                                                                                                                                                                                       |

---

## Quick start

```sh
npm install
npm run dev        # http://localhost:5173
```

**`.env.development` ships with `VITE_WS_URL` set, so the default `npm run dev`
expects the mock server.** With the server stopped, every turn fails with
`SOCKET_UNREACHABLE` — which is a legitimate state to look at, but it is not the
canned demo. To run the UI entirely on its own, comment out `VITE_WS_URL` and
restart (see [Response modes](#response-modes)).

To run against the server:

```sh
# terminal 1 — ../chat-ws-server
npm install && npm run dev        # ws://localhost:8787

# terminal 2 — here
npm run dev
```

### Routes

| Route            | What it is                                                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`              | Landing page linking to the demos                                                                                                                                                                                                     |
| `/chat`          | Full-page assistant — sidebar, streaming, inline citations + reference reader                                                                                                                                                         |
| `/widget-demo`   | A host page ("Alder & Finch") with the chat embedded as a floating widget                                                                                                                                                             |
| `/workflow-demo` | A multi-step agentic run with a human approval step — React Flow canvas, normal/compact views, zoom levels of detail. See [its README](apps/chat/src/demo/workflow-demo/README.md)                                                    |
| `/workflow-live` | The same canvas driven by `../workflow-ws-server`: three workflow variants stream in, the run log fills as work happens, and approvals go back over the socket. Falls back to the hard-coded run when `VITE_WORKFLOW_WS_URL` is unset |

### Project structure

```
apps/chat/src/
  demo/                    the Aristotle app that consumes the packages
    App.tsx                full-page chat
    config.ts              Aristotle branding
    components/            app chrome — Sidebar, TopBar, conversation shell, …
    mocks/                 client-side fallback data — canned turns and suggestions
    widget/                Aristotle widget bootstrap
    pages/                 landing, widget host and primitive workbenches
    workflow-demo/         agentic run canvas (React Flow) — see its README
      canvas/              the portable kit — nodes, edges, zoom tiers
      run/                 the RunSource seam — wire types, layout, reducer, sources
      panels/              host chrome — sidebar, top bar, inspector, lanes, run log
      example/             the hard-coded loan run
  main.tsx                 router entry; every demo is served by this app

packages/
  chat-ui/                 chat components, engine, hooks and widget shell
  ui/                      product-agnostic primitives and shell components
  tokens/                  themes, tokens, fonts and shared utilities
```

---

## Response modes

Two responders behind one `Responder` interface, selected by one environment
variable ([App.tsx](apps/chat/src/demo/App.tsx), [aristotleWidget.tsx](apps/chat/src/demo/widget/aristotleWidget.tsx)):

| `VITE_WS_URL`             | Responder               | Turns come from                           |
| ------------------------- | ----------------------- | ----------------------------------------- |
| set (the shipped default) | `createWsResponder`     | `../chat-ws-server/src/scenarios.ts`      |
| unset / commented out     | `createCannedResponder` | `apps/chat/src/demo/mocks/cannedTurns.ts` |

`VITE_WS_URL` is read **only at Vite startup**. Editing `.env.development` needs
a dev-server restart; an HMR reload won't pick it up.

The workflow canvas has the same seam, one level up: `RunSource` instead of
`Responder`, chosen by its own variable
([LiveWorkflow.tsx](apps/chat/src/demo/workflow-demo/LiveWorkflow.tsx)).

| `VITE_WORKFLOW_WS_URL`    | Source                  | Runs come from                                        |
| ------------------------- | ----------------------- | ----------------------------------------------------- |
| set (the shipped default) | `wsRunSource`           | `../workflow-ws-server/src/variants/`                 |
| unset / commented out     | `createStaticRunSource` | `apps/chat/src/demo/workflow-demo/example/loanRun.ts` |

`/workflow-demo` always uses the static source, so it works with no server at
all. Only `/workflow-live` looks at the variable. Both ports are separate:
chat is 8787, workflow runs are **8788**.

### What runs where

The canned responder is not a strict subset of the server — each reaches
something the other can't.

| Capability                                                     | Canned (UI alone) | With the server |
| -------------------------------------------------------------- | :---------------: | :-------------: |
| Streaming answer + reasoning block                             |        ✅         |       ✅        |
| Inline `[n]` citations, reference reader, source highlights    |        ✅         |       ✅        |
| 50-document stress corpus                                      |        ✅         |       ✅        |
| Follow-up chips                                                |        ✅         |       ✅        |
| `recovered` / `failed` / `stopped` turn states                 |        ✅         |       ✅        |
| **Tool-call chips**                                            |        ❌         |       ✅        |
| **Faults tallied on the finished answer (untimed trace rows)** |        ❌         |       ✅        |
| **Dedupe of a fault reported by both routes**                  |        ❌         |       ✅        |
| **Model name + token count in the trace**                      |        ✅         |       ❌        |

Why each of the last four falls where it does:

- **`CannedTurn` has no tool field at all**
  ([chatEngine.ts](src/lib/engine/chatEngine.ts)). Tool chips are unreachable
  without the server — there is no keyword that will summon one.
- `CannedTurn` _does_ have an `errors` field, but no canned turn sets it. The
  untimed trace rows and the dedupe-by-`code` path only appear via the server's
  `degraded` scenario.
- Conversely, `model` and `tokens` are stamped onto every canned turn
  ([cannedTurns.ts](src/demo/mocks/cannedTurns.ts)) while the server's `summary`
  event never sends them. The trace's model row is the one thing you _lose_ by
  running the server.

Everything outside the response stream is UI-only in both modes: the theme
toggle, sidebar, account menu and its two settings dialogs, persona menu,
resizable reference pane, the embedded widget, and side tabs.

Two composer affordances are deliberately façades, so nobody goes hunting for a
backend: the **mic** drives the browser Web Speech API and hides itself where
unsupported, and **attachment chips** are cleared on submit and never sent
anywhere.

---

## Prompt keywords

Both responders route on the prompt text, and they route on **different words**.
In both, matching is case-insensitive substring — not word-boundary — so
"failure" trips `fail`. **The first rule that matches wins.**

### Canned responder — no server

Dispatched by `turns.find(t => t.match?.test(prompt))` in
[chatEngine.ts](src/lib/engine/chatEngine.ts); the turns live in
[cannedTurns.ts](src/demo/mocks/cannedTurns.ts).

| Prompt matches                                 | You get                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| `50`, `stress`, `many ref`, `lots of ref`      | 50-source corpus, citations scattered `[3]`→`[50]`                      |
| `hiccup`, `recover`, `drop`, `flaky`, `glitch` | `recovered` — drops at 35%, then carries on                             |
| `fail`, `fatal`, `dead`, `completely`, `break` | `failed` — dies at 72%, partial answer + frayed rail                    |
| anything else                                  | cycles three turns: savings (5 sources) → planning (2) → brainstorm (2) |
| any turn, then **Stop**                        | `stopped` — which is not a fault                                        |

### Mock server

From `pickScenario` in [../chat-ws-server/src/scenarios.ts](../chat-ws-server/src/scenarios.ts),
in evaluation order:

| Prompt matches                                                       | Scenario                                                                                                                                                                                                       |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `degraded`, `partial`, `unhealthy`, `issues`                         | A streamed `RETRIEVAL_TIMEOUT`, a fallback keyword search, a failed rerank call, then an answer; three problems tallied on the summary, one code (`RETRIEVAL_TIMEOUT`) reported by both routes to prove dedupe |
| `error`                                                              | Two tool calls succeed, then the stream dies mid-answer (`UPSTREAM_UNAVAILABLE`) — fatal                                                                                                                       |
| `fail`                                                               | Two quote sources fail in sequence, a cached quote succeeds and gets range-checked, the model recovers and answers                                                                                             |
| `50` (standalone), `stress`, `many ref`, `lots of ref`               | A corpus-ranking tool call, then a 50-source corpus                                                                                                                                                            |
| `cite`, `citation`, `reference`, `source`, `budget`, `save`/`saving` | A reference-search tool call, then a five-source cited answer                                                                                                                                                  |
| `tool`, `search`, `rate`, `market`                                   | Four sequential tool calls (rates, index moves, volatility, account allocation)                                                                                                                                |
| anything else                                                        | Alternates tool-heavy ↔ plain                                                                                                                                                                                  |

Every server scenario now runs several `thinking` steps — the model reacting to
each tool result in turn — interleaved with however many tool calls its story
needs; the tool-heavy scenarios run 4–6. `plain` stays tool-free on purpose: a
tool call on a pure conceptual question ("explain compound interest") would be
dishonest about what a real model does, so it gets more reasoning depth instead.

Two collisions worth knowing before you go looking for a bug:

- `error` is tested before `fail`, so "the tool errored and failed" gets the
  fatal scenario.
- `source` (rule 5) is tested before `search` (rule 6), so "search my sources"
  gets citations, not tool calls.

And one result that surprises people: the server's **`fail` scenario produces a
`recovered` turn, not a failed one**. A failed tool the model works around
upgrades the trace to `recovered` ([useChat.ts](src/lib/hooks/useChat.ts)) —
`error` is the only server route to `failed`.

---

## Other string values

| Where                 | Values                                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme class           | `chat-theme-default`, `chat-theme-aristotle1`, `chat-theme-aristotle2`, `chat-theme-graphite` — or the attribute form, `data-chat-theme="graphite"` |
| Colour mode           | `dark` / `light` class, on the **same element** as the theme                                                                                        |
| Widget script tag     | `data-auto-init`, `data-theme` (`light`/`dark`/`auto`), `data-theme-class`, `data-position` (`bottom-right`/`bottom-left`)                          |
| `mountWidget` options | `target`, `theme`, `themeClass`, `position`, `zIndex`                                                                                               |
| Env                   | `VITE_WS_URL` — set for the chat server, unset for canned; `VITE_WORKFLOW_WS_URL` — set for live workflow runs, unset for the hard-coded one        |
| localStorage          | `aristotle-theme`, `aristotle-brand-theme`, `sidebar-collapsed`, `demo-features`, `demo-highlight`, `ref-panel-w`                                   |
| sessionStorage        | `workflow-run-id`, `workflow-variant-id` — what `/workflow-live` re-attaches to after a reload                                                      |

`demo-features` is worth remembering: it persists the feature toggles, so a
capability can look "missing" because it was switched off in a previous session.
The modal's **Reset** puts everything back. The machinery behind those toggles
is generic and shipped — see the
[user-toggleable features recipe](#recipe-user-toggleable-features).

---

## Recipe: user-toggleable features

The demo's "Feature toggles" panel — one of the two entries behind the
sidebar's account avatar — is presenter chrome, but the machinery under
it is not demo-specific — it is in `src/lib/settings` and
`src/lib/components/settings`, and it is built for exactly the case where a
tenant gives different features to different users.

### The one idea worth keeping

**Gate the data, not the components.** `applyFeatureGate` deletes the `Message`
fields a switched-off feature owns, just before render:

```tsx
const shown = useMemo(() => applyFeatureGate(messages, flags), [messages, flags])
```

Nothing downstream has an `if (flags.x)` in it. `ChatMessage`, `ThinkingBlock`,
`SourceStrip` and the rest only ever see a message that genuinely lacks
reasoning, tools or sources — which is why adding a feature next quarter
touches the catalogue and the field map, not twenty components.

### The four pieces

| Piece              | What it owns                                                    |
| ------------------ | --------------------------------------------------------------- |
| `FeatureCatalogue` | what this viewer may switch — sections, labels, hints, defaults |
| `useFeatureFlags`  | on/off state, hydration, persistence                            |
| `applyFeatureGate` | turning "off" into a message without those fields               |
| `<FeatureToggles>` | the switch list — rows and headings, no dialog                  |

### Wiring it up

```tsx
import {
  useFeatureFlags,
  applyFeatureGate,
  FeatureToggles,
  type FeatureCatalogue,
} from 'chat-interfaces'

type Id = 'thinking' | 'tools' | 'sources'

const CATALOGUE: FeatureCatalogue<Id> = [
  {
    id: 'before',
    title: 'Before the answer',
    description: 'What the assistant shows while it is still working.',
    features: [
      { id: 'thinking', label: 'Reasoning', hint: 'The “Thought for Ns” block.' },
      { id: 'tools', label: 'Tool calls', hint: 'A status chip per tool.' },
    ],
  },
  {
    id: 'during',
    title: 'In the answer',
    features: [{ id: 'sources', label: 'Citations', defaultOn: false }],
  },
]

function Settings() {
  const { flags, setFlag, reset } = useFeatureFlags<Id>({
    catalogue: CATALOGUE,
    storageKey: `chat-settings:${tenantId}:${userId}`,
  })

  return <FeatureToggles catalogue={CATALOGUE} flags={flags} onChange={setFlag} />
}
```

The catalogue is plain data, so the panel is one loop — sections render in
order, each with its heading and description, and a section whose features are
all filtered out renders nothing at all rather than leaving a heading over
empty space.

`<FeatureToggles>` also takes `spine`, which draws a vertical rule with a node
per section. It is off by default because it implies the sections are a
sequence — true of the demo's "before / in / after the answer", false of most
settings groupings.

### Per-tenant and per-role

Entitlement is decided **once, by what you put in the catalogue**. Build it per
viewer and hand over the remainder:

```tsx
const catalogue = useMemo(
  () =>
    FULL_CATALOGUE.map((section) => ({
      ...section,
      features: section.features.filter((f) => entitlements.includes(f.id)),
    })),
  [entitlements],
)
```

Three behaviours make that safe, and all three are deliberate:

- **A feature absent from the catalogue cannot be switched on from storage.**
  If someone had a feature, enabled it, and then lost it — plan downgrade,
  policy change, role change — `useFeatureFlags` drops the stored `true` rather
  than honouring it. Without this, revoking a feature server-side would leave it
  running for exactly the users who had used it.
- **Stored values merge over defaults**, so a feature you ship next month shows
  up at its own default instead of missing for everyone who has saved before.
- **Non-boolean stored values are ignored.** A hand-edited or corrupted blob
  falls back rather than rendering a switch in a third state.

For "has it but cannot change it" — a plan gate you want visible rather than
hidden — use `locked` and `lockedReason` instead of filtering the feature out:

```tsx
{ id: 'trace', label: 'Turn details', locked: true, lockedReason: 'Included on the Team plan.' }
```

### Persistence

`storageKey` is required and has no library default: two surfaces that quietly
share one key overwrite each other, and the bug presents as "my settings reset
themselves". Scope it to the surface **and** the viewer. Pass `null` for a
session that should not persist (a preview, an impersonated support session).

For server-backed preferences, pass `storage` — anything with `getItem` and
`setItem`:

```tsx
useFeatureFlags({ catalogue, storageKey: userId, storage: myPreferenceStore })
```

Both methods may throw or return null; the hook treats any failure as "no
stored value", so a settings panel that cannot reach its store still renders
with defaults rather than taking the page down.

### Features with no message fields

`MESSAGE_FEATURE_FIELDS` maps each feature to the `Message` fields it owns.
Extend it rather than replacing it:

```tsx
const FIELDS = { ...MESSAGE_FEATURE_FIELDS, attachments: ['attachments'] } as const
applyFeatureGate(messages, flags, FIELDS)
```

A feature with no fields — the demo's `actions`, which rides the `showActions`
prop — simply has no entry, and you gate it where you render:

```tsx
<ChatMessage showActions={flags.actions} … />
```

### The appearance sections

`<PalettePicker>` and `<HighlightPicker>` ship alongside the toggles and are
optional on purpose: an internal tool wants both, a white-labelled deployment
wants neither (the tenant's palette is not the end user's to change), and a
product that ships one brand but cites heavily wants only the highlight. Each
takes `title` and `description`, so a tenant retitles a section without forking
the component:

```tsx
{
  appearance.palette.show && (
    <PalettePicker
      options={SHIPPED_PALETTES}
      value={palette}
      onChange={setPalette}
      title={appearance.palette.title}
      description={appearance.palette.description}
    />
  )
}
```

`useStoredChoice` persists a one-of-N choice with the same
validate-against-what-is-offered rule as the flags, and `usePaletteClass`
applies the `chat-theme-*` class. That last one defaults to `<html>` because
`body` paints `var(--canvas)`, which resolves at `:root` — a palette scoped to
an inner element leaves the page behind it on the old colours. It does not stop
a flash on first load; that needs a small inline script in the head reading the
same key, as `index.html` does.

### What the library deliberately does not ship

No dialog, header, or reset button. Every product wants its own settings shell,
and an inherited one is the part people end up fighting. The demo writes two of
them, which is the other half of the point: `FeatureTogglesModal` holds the
switch list (what a response may render — presenter chrome), and
`UserSettingsModal`, opened from the same account menu, holds the profile plus
the two appearance pickers (a viewer's own preference). Same library
components, regrouped by whose decision each one is.

---

## Theming

Every colour in the library lives in `src/lib/brand.css`. Components never name
a palette step — they use intent-named utilities (`bg-accent`, `text-ink-soft`,
`border-line`, `hover:bg-tint/8`) that resolve through CSS custom properties, so
a consuming app re-skins the whole UI by setting **one class** (or data
attribute) on its root element.

### Picking a theme

```text
<html class="chat-theme-aristotle2 dark">         <!-- class form -->
<html data-chat-theme="aristotle2" class="dark">  <!-- attribute form -->
```

Both forms work for every theme. Four are shipped:

| Theme                                            | Identity                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| `chat-theme-default` (also the no-class default) | PNC retail — `#004c97` blue, `#ef6a00` orange, near-white canvas         |
| `chat-theme-aristotle1`                          | the palette the library shipped with — same blue, lighter `#f7841f`      |
| `chat-theme-aristotle2`                          | PNC corporate — `#084d77` / `#001e33` deep navy, same orange             |
| `chat-theme-graphite`                            | the default's blue identity on a near-neutral `#0f1214` charcoal in dark |

Values marked `✔` in `brand.css` are taken from PNC's live stylesheets: the
default's from pnc.com, `aristotle2`'s deep navy from the Corporate &
Institutional page, whose hero band is `#001e33` with pure white on it.

### The three dark modes

The themes differ mostly in **dark** — light mode is near-identical across
`default` and `graphite` by design, and only a shade apart in `aristotle2`. What
separates them is how much colour the dark field carries, measured as oklch
chroma:

| Theme        | `--canvas-dark` | chroma  | Reads as                                       |
| ------------ | --------------- | ------- | ---------------------------------------------- |
| `default`    | `#04172a`       | `0.046` | navy, but calm enough to sit behind content    |
| `aristotle2` | `#001e33`       | `0.054` | deeper and cooler, pure white headings         |
| `graphite`   | `#0f1214`       | `0.006` | effectively neutral — the darkest of the three |

For scale: the default's dark panel used to sit at `0.085`, which is more colour
than a dark surface can carry without competing with what is on it. That was the
"too blue" complaint, and trimming the chroma — not changing the hue — is what
fixes it.

`--action` is the counterweight. It is the composer's send button and nothing
else, it defaults to `--brand-solid`, and in dark it becomes the theme's
`--ember-500` with a near-black glyph. One saturated control against a
desaturated field is the whole recipe: the same warm hue spread across chips,
rails and avatars stops reading as emphasis and starts reading as decoration.
The second ambient bloom (`--canvas-glow-b`) carries the only other warm note,
at 14% and purely decorative.

The demo exposes the choice in **Demo features → Palette**, persisted as
`aristotle-brand-theme` and applied by `index.html` before first paint. A real
app hardcodes one class on `<html>` instead.

The theme selector and `dark`/`light` must sit on the **same element** —
`brand.css` derives its light and dark tokens on whichever element carries the
theme. `index.html`'s pre-paint script and the widget already do this.

### Which colour means what

The palette reads by one rule:

> **One blue carries the product. Warmth is spent in two places, deliberately.**

It did not always. The palette used to run brand blue against an action orange,
and the orange failed where it mattered: `#ef6a00` behind a white glyph is
**3.12:1**, under the 4.5:1 text bar, which is what the side-tab count badge and
the Recent chats "Active now" row were both doing. `--accent-*` is now aliased
to each theme's `--brand-*` ramp with `var()` rather than copied hex, so the two
cannot drift.

That leaves three warm values, and they are not interchangeable:

| Token                      | Where                               | Contrast rules                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--ember-*`                | the orb's two blooms, only          | **Exempt** — the mark is `aria-hidden` decoration. Never reuse these for text, icons, or state; that is what the other one is for.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `--notify` / `--on-notify` | the launcher's unread badge         | **Checked, and the one literal in the file.** A white count on an orange badge is squeezed from both ends: the ink needs 4.5:1 on the fill, so the fill must be dark; the badge needs 3:1 on the surface behind it, so against navy the fill must be light. That band is about one ramp step wide and no theme's `--ember-600` sits in it. `#cb4a11` clears both everywhere shipped — 4.64:1 for white on the fill, 3.12–4.64:1 for the fill on the panels and canvases it lands on. Where it overhangs the launcher sphere, a gradient in this same warm hue (1.49:1 at the bloom), the edge is carried by a shadow rather than a border. Re-run both ratios before touching it. |
| `--highlight`              | the `<mark>` behind a cited passage | **Warm by choice, not by contrast.** A highlight marks where to look; sharing a colour with every button and link makes it read as another control. Swappable — see below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

A theme that declares no `--ember-*` falls back to its accent, so the orb is
never undefined.

#### Highlight swatches

`--highlight` backs every `<mark>` — the cited passage in a reference document,
and the same passage in a citation chip's hover preview. It defaults to the
theme's warm hue; `brand.css` §5 ships five alternates, picked with a class or
the matching `data-` attribute on any element:

```html
<html class="chat-theme-aristotle2 chat-highlight-yellow dark"></html>
```

```js
mountWidget(content, { themeClass: 'chat-theme-aristotle2 chat-highlight-teal' })
```

`orange` (the default), `amber`, `yellow`, `blue` (the pre-orange behaviour —
the theme's own action hue), `teal`, `violet`. The demo's **Demo features**
panel has a picker, so they can be compared against real content.

Two things about them are worth knowing before picking one.

**The wash strength is a token, not a constant.** A `<mark>` is drawn with the
`.highlight-wash` utility, which mixes `--highlight` at `--highlight-strength`
— 25% on light, 45% on dark, and lower again for the two luminous swatches. It
has to vary, because a translucent warm hue over navy is mostly navy: at 25%
_every_ orange in the ramp composites to within about 6/255 of neutral grey. It
is the alpha, not the orange. It is also why this is a utility rather than a
`--highlight-wash` custom property, which looks like the obvious move and
silently doesn't work — a custom property containing `var()` is substituted
where it is _declared_, so a wash composed on `:root` keeps `:root`'s hue and
strength however far below it a `.dark` ancestor or a swatch class redeclares
them.

**None of them is a contrast failure, but they are not equal.** Each was checked
against all three shipped themes in both modes; `--ink-strong` on the wash lands
between 5.7:1 and 13.5:1 throughout. What differs is how much like itself each
one looks. On white, every swatch is plainly its own hue except yellow, which
barely separates from the page at any strength — the classic highlighter colour
is the one screens serve worst. On navy it is the warm hues that struggle, since
they composite toward brown. The cold three — blue, teal, violet — read cleanly
in both modes, so they are the safe pick for a surface that has to work in
either. And none of it substitutes for the wording or structure that makes a
highlight legible without colour at all (WCAG 1.4.1); a wash is reinforcement,
not the signal.

`--accent` also inverts in dark, for the same reason `--brand-solid` does below:
a mid-ramp blue fill sits at ~2.0–2.8:1 against a dark panel and the badge simply
vanishes, so dark uses `--accent-200` with an `--accent-700` glyph. And
`--accent-fg` steps to `--accent-300` on dark — `400` lands at 3.1–3.9:1 across
the shipped themes, under the text bar.

`--brand-solid` / `--on-brand-solid` is the **single** solid brand fill; there is
deliberately no second name for it. It **inverts in dark**: a solid fill has two
contrast constraints at once — the fill against the panel, and the glyph against
the fill — and no blue in the ramp clears both on a dark canvas (`brand-600` is
1.89:1 on the panel, `brand-300` drops a white glyph to 2.41:1). Dark therefore
uses a near-white fill with a deep glyph, the same lift `--rail` and `--tint`
make. Don't "fix" it back to blue.

### The three tiers

| Tier | Where                         | What                                                                                   |
| ---- | ----------------------------- | -------------------------------------------------------------------------------------- |
| 1    | a theme block in brand.css    | raw ramps (`--brand-50…950`, `--accent-200…700`, `--danger-*`, `--ember-*`) + surfaces |
| 2    | §1/§2 of brand.css            | semantic tokens (`--accent`, `--ink-soft`, `--line`, `--rail`, `--tint`, `--orb-*`)    |
| 3    | `@theme inline` in styles.css | Tailwind names — `--color-accent: var(--accent)` → `bg-accent`                         |

Tier 3 uses `@theme inline` deliberately: it makes `bg-accent` compile to
`var(--accent)` rather than a `:root`-pinned `var(--color-accent)`, which is
what lets a theme class re-derive tokens at _any_ scope — including inside the
widget's shadow root, where `:root` never matches.

### Adding a theme

A theme is one block. Copy the commented template at the bottom of
`src/lib/brand.css`: declare the ramps (`--brand-50…950`, `--accent-300…700`,
`--danger-300…700`) plus the light _and_ dark surface/ink values
(`--canvas-light`, `--canvas-dark`, …) and every other token derives. Name it
`chat-theme-<yours>` — the derivation blocks match on that prefix.

One step is easy to miss: `--accent-500` is every solid accent fill and keeps
your exact brand value, while `--accent-700` is the accent used as _text_ on the
canvas. Pick the latter for ≥4.5:1 — a brand orange at full saturation is
typically ~3:1 on a near-white background.

You do not have to edit `brand.css` at all: declaring the same tier-1 variables
in your own stylesheet, on `:root` or on any element, re-themes everything below
that element.

### Theming the embedded widget

The widget renders into a shadow root, so a theme class on the host page cannot
reach it. Pass it explicitly:

```js
AristotleChat.init({ theme: 'auto', themeClass: 'chat-theme-aristotle2' })
```

```html
<script
  src="/aristotle-widget.js"
  data-auto-init
  data-theme="auto"
  data-theme-class="chat-theme-aristotle2"
></script>
```

`theme` stays light/dark/auto; `themeClass` is the brand palette. The
`/widget-demo` route does both — page and widget run on `chat-theme-aristotle2`,
and the page adds its own serif `--font-display-family` on top without touching
`brand.css`.

---

## Turn status and errors

Every assistant turn carries a `trace` (`src/lib/types.ts`) recording what it did
and how long each phase took. How that surfaces depends on severity, which is the
whole design rule: **severity picks the placement, not a color on a shared icon.**

| Status      | What it means                               | How it looks                                                             | Component          |
| ----------- | ------------------------------------------- | ------------------------------------------------------------------------ | ------------------ |
| `ok`        | Nothing went wrong                          | `2.4s` at the right of the action row, opening a timeline                | `TurnTraceHandle`  |
| `recovered` | Something failed mid-stream, answer arrived | `6.8s · recovered` — same ink, no badge, no tint; actions stay available | + `TurnTracePanel` |
| `stopped`   | The reader pressed Stop                     | The existing "Stopped" label; the trace stays clean                      | —                  |
| `failed`    | No answer                                   | The turn's rail frays out, then the verdict and `Retry`                  | `TurnTraceFailure` |

Only `failed` sets `Message.error`. A recoverable error lands on the trace as a
`fault` step instead, so a good answer is never wrapped in a red box — the only
danger color for a recovered turn lives on one row _inside_ the opened panel.

**The failed turn has no disclosure on purpose.** When there is no answer to
read, the timeline is not a detail hiding behind "Details" — it is the only
content the turn has, so it is shown outright. It also wears no box: every other
assistant turn is bare text hanging off the orb, and a failure that arrives as a
card reads like a system notice pasted into the thread rather than a turn that
went wrong. Instead the turn's own rail (the one `ThinkingBlock` and
`ToolCallChip` already use to mean "inside this turn") runs alongside whatever
the turn managed, then frays out where the stream died. Below the break the text
returns flush with the message, because the verdict speaks to the reader rather
than describing the turn's interior.

Exactly two things carry danger color there — the frayed rail and the verdict.
The reason stays in ordinary ink, because it is information, not alarm.

### The rail

The rail is a graphical object that carries meaning, so WCAG 2.2 SC 1.4.11
applies: it needs 3:1 against the surface it sits on. It uses `--rail` —
`--brand-600` at 70% in light, white at 45% in dark — which clears 3:1 in all
three shipped themes and both modes. The accent hue cannot do this job; at full
strength it reaches only ~3.04:1 on the light panel, the same shortfall
`brand.css` already notes for `--focus-ring`.

Two rules follow, and both are load-bearing:

- **Alpha lives in the token, not the component.** Use a bare `border-rail` (or
  the `.turn-rail` utility). Adding an opacity modifier silently breaks the
  ratio — which is exactly how the old `border-accent/40` ended up at 1.57:1.
- **Don't stack opacity on `--ink-soft` either.** It is already tuned as the
  AA-passing secondary ink (4.81:1 light / 6.31:1 dark); an `opacity-70` on top
  drops it to 2.74:1. The trace panel gets its hierarchy from the mono face and
  the fixed stamp column instead.

The rail idiom is defined once, in `styles.css` beside `.glass` — `.turn-rail`
and `.turn-rail-end` (the fade where a failed turn's rail runs out). Four
components use it: the trace timeline, `ThinkingBlock`, `ToolCallChip`, and
markdown blockquotes. `--rail` derives from `--brand-600`, so a new
`chat-theme-*` gets it without declaring anything.

Turn the whole thing off with the **Turn details** toggle in the demo features
modal (sidebar → _After the answer_); a failed turn keeps its verdict and
`Retry`, and simply loses the timeline.

### Seeing each state

**Failed, with nothing to show** — the shipped setup with the server stopped.
The socket never opens, so the turn dies before doing anything.

```sh
npm run dev          # leave ../chat-ws-server stopped
```

Send anything. There is deliberately **no rail and no timeline** here — a rail
with nothing alongside it is a stray mark, not a timeline — so you should see
only the verdict, the reason, and `Retry`. Confirm `Retry` drops the failed
answer and re-runs the same user turn (it fails again while the server is down;
that's correct).

**Everything else without the server** needs the canned responder. Comment out
`VITE_WS_URL` in `.env.development` and **restart** the dev server — Vite only
reads `.env` at startup, so an HMR reload won't pick it up.

```sh
# .env.development
# VITE_WS_URL=ws://localhost:8787
```

Then use the [canned keyword table](#canned-responder--no-server). Both scripted
fault turns are driven by one field — `fault: { at, message, fatal? }` on
`CannedTurn` — and carry a `match`, so they stay out of the normal rotation and
only play on demand.

Two things to check, because they are what the design is for:

- **Recovered shows nothing inline.** The fault is only visible once you open the
  duration handle. If a badge, tint, or warning icon appears on a turn that
  answered fine, that's the bug.
- **The failed turn has no second control.** Its own block owns recovery, so the
  copy / regenerate / vote row is suppressed — a Regenerate button sitting under
  a Retry makes two controls compete for the same job.

**Richer failures** — the server's `degraded`, `error`, and `fail` scenarios put
tool calls and multi-fault tallies in the mix. Use those once it's running.

---

## The launcher

The floating control has three states, and one of them is gated on the
conversation.

| State         | Looks like                              | When                                       |
| ------------- | --------------------------------------- | ------------------------------------------ |
| Rest          | the bare 50px sphere, no glyph          | always                                     |
| Hover / focus | sphere plus a label opening to its left | **only while `messages.length === 0`**     |
| Open          | white disc with a blue `X`              | panel showing                              |
| Minimised     | sphere with an unread count             | a turn finished while the panel was closed |

Three decisions in there are worth knowing before you change any of it.

**The sphere carries no glyph.** It is the mark; anything drawn on it competes
with its own highlight. The white chat icon that used to sit there measured
**2.93:1** against the gradient beneath it — under the 3:1 a control glyph needs.
Open swaps the sphere for a plain disc rather than tinting the glyph, because a
blue `X` on the orb itself is ~1.9:1. On the disc it is 7.67:1.

**The label opens away from the anchored edge, and the sphere never moves.** The
launcher is pinned bottom-right, so a label that pushed the sphere left would
pull it out from under the cursor that triggered the hover — which drops the
hover, which collapses the label, which puts the sphere back under the cursor.
A flicker loop. There is also an 80ms close delay so crossing the label's edge
doesn't chatter. `bottom-left` mirrors with `flex-row-reverse`.

**The label is an empty-thread affordance, not onboarding.** `fresh` is literally
`messages.length === 0`, so it resets on reload by design: someone returning to a
blank widget is told what it is again. If you ever want once-per-visitor instead,
that is a persisted flag and a different feature.

`launcherLabel` on `WidgetContent` sets the text; it defaults to
`Chat with <appName>`. The width animates with `grid-template-columns: 0fr → 1fr`
rather than a fixed px value, so a longer label is not clipped.

### Testing it

```sh
npm run dev          # then open /widget-demo
```

**The label.** Hover the sphere on a fresh conversation — it should widen and
the label fade in, with the sphere stationary. Send anything, minimise, hover
again: no label. That is the gate working, not a bug.

Two ways to see nothing and think it's broken:

- **Touch, or DevTools device emulation.** The expansion lives inside
  `@media (hover: hover)`. A coarse pointer never matches, deliberately — on
  touch `:hover` sticks after a tap and the label would never close again.
- **Keyboard.** `Tab` to the launcher and it expands on `:focus-visible`. This is
  not decoration: the label is the button's only visible name.

**The unread badge** is the fiddly one, because it needs a turn to _finish_ while
the panel is closed:

1. Comment out `VITE_WS_URL` and **restart** the dev server (see
   [Seeing each state](#seeing-each-state) — Vite reads `.env` only at startup).
   The canned responder streams word by word, which gives you a window to work in;
   with the socket version the turn fails in well under a second and you will not
   beat it.
2. Open the widget, send a prompt, and minimise **while it is still streaming**.
3. Wait for it to finish. The badge appears with the count, and the button's
   `aria-label` becomes `Ask Aristotle — 1 new reply`.
4. Reopen. The badge clears and stays clear on the next minimise.

If you minimise _after_ the answer lands, there is correctly no badge — you read
it. Any finished turn counts, including one that failed: the reader still has
something to come back to.

The count is derived from the thread rather than accumulated in state, against a
watermark of the last _settled_ message. That word is load-bearing:
`useChat` appends the assistant message **empty, with `streaming` undefined**, and
only sets it `true` once content starts — so both a falsy `!m.streaming` check and
a plain last-id watermark mark a turn read before it has produced a word, and the
badge never fires. `isSettled` compares `streaming === false`, which every
terminal path in `useChat` sets (done, fault, abort, responder throw).

## The persona side panel

Third tab on the widget's rail. A persona `<select>` over the stacked prompt
templates in force.

The select is native on purpose: it keeps the OS picker and its keyboard
handling working inside the widget's shadow root, where a custom popup would
have to re-solve outside-click and portalling. The widget root already sets
`colorScheme`, so the native list follows the theme.

To test: open the rail's sparkle tab, change the persona and confirm the hint
line and the textarea placeholder both follow. The template layers are read-only
— clicking into one and typing should change nothing, while the text stays
selectable and the field still takes focus.

Ordering comes from each layer's `priority`, not from array order. To prove it,
reverse the `priority` values in `demoPromptTemplates`
(`src/demo/mocks/sideTabData.ts`) and leave the array alone: the panel re-orders,
the array does not.

---

## Embeddable widget

The widget can be built as a single self-contained IIFE that any page loads with
one script tag:

```sh
npm run build:widget       # → apps/chat/dist-widget/aristotle-widget.js (exposes window.AristotleChat)
npm run preview:widget
```

```html
<script
  src="/aristotle-widget.js"
  data-auto-init
  data-theme="auto"
  data-theme-class="chat-theme-aristotle2"
  data-position="bottom-right"
></script>
```

All widget DOM lives in a shadow root, so host-page CSS can't restyle it and its
Tailwind styles can't leak out — including the host's theme class, which is why
the palette is passed in via `data-theme-class` / `themeClass` (see
[Theming](#theming)). The one exception is the font: `@font-face` rules don't
register from inside a shadow root, so the stylesheet link goes into the host
document's head while the family is only ever _used_ inside the shadow tree.

Auto-init requires a **classic** script tag — `document.currentScript` is `null`
in module scripts. Module consumers instead
`import { init } from '.../aristotleWidget'` and call `init(options)`, which
returns an `open` / `close` / `setTheme` / `destroy` handle.

---

## Scripts

| Script                   | Does                                          |
| ------------------------ | --------------------------------------------- |
| `npm run dev`            | Dev server                                    |
| `npm run build`          | Type-check + production build of the demo app |
| `npm run preview`        | Serve the built demo app                      |
| `npm run build:widget`   | Build the embeddable widget bundle            |
| `npm run preview:widget` | Serve the built widget + its embed test page  |
| `npm run typecheck`      | `tsc -b` in every workspace                   |
| `npm run lint`           | oxlint                                        |
| `npm run format`         | Oxfmt write (`format:check` to verify only)   |
