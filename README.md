# chat-interfaces

A **brand-agnostic chat component library** (`src/lib`) — the thing this repo
exists to produce — plus a **demo app** (`src/demo`) that consumes it as the
fictional "Aristotle" finance assistant. The library is the product; the demo is
how you look at it. React 19 + Vite + Tailwind v4.

Nothing in `src/lib` imports from `src/demo`. The product name arrives through a
`BrandingProvider`, personas / starters / side panels are props, the widget shell
takes its responder and content from the host, and every colour resolves through
a theme class (see [Theming](#theming)). Point those five things at a different
brand and the same library is a different product.

---

## The library

`src/lib/index.ts` is the public barrel. Everything below is exported from it.

### Components

One folder per component — `index.ts`, `<name>.tsx`, `types.ts`.

**Conversation**

| Component       | What it is                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ChatMessage`   | One turn. Composes the thinking block, tool chips, markdown body, source strip, trace handle, and action row.                                                                                                                                                |
| `Markdown`      | GFM renderer that rewrites `[n]` markers into `CitationChip`s. Only numbers matching a real source id are rewritten, so `[sic]` passes through; a half-received trailing `[12` is hidden mid-stream so it never flickers as plain text.                      |
| `ThinkingBlock` | The collapsible "Thought for Ns" panel above an answer.                                                                                                                                                                                                      |
| `ToolCallChip`  | One tool call as a status chip — pulsing while running, check when done, red with the reason when it fails. Finished calls expand to their input/output JSON.                                                                                                |
| `Composer`      | The input: auto-growing textarea, expand toggle, attachments, mic, persona menu, send/stop. `Enter` queues while streaming, `Cmd/Ctrl+Enter` steers.                                                                                                         |
| `FollowupChips` | Suggested next prompts, drawn as branches off the answer above them — a hairline spine through the orb gutter with a node per chip.                                                                                                                          |
| `PersonaMenu`   | Persona picker; labelled pill, or icon-only when compact. The labelled pill also collapses to an icon-only circle on its own — a `@container` query on `Composer`'s wrapper, independent of the `compact` prop — once the row is squeezed too narrow for it. |

**Citations**

| Component        | What it is                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `CitationChip`   | An inline `[n]` marker as a small clickable chip. The superscript is a translate rather than `<sup>`, so line-height stays stable.       |
| `SourceStrip`    | Compact row of numbered source pills under an answer.                                                                                    |
| `ReferencePanel` | The reader: one reference document with prev/next, a numbered pill rail, and arrow keys — jumping from reference 2 to 21 is one gesture. |

**Turn status**

| Component          | What it is                                                              |
| ------------------ | ----------------------------------------------------------------------- |
| `TurnTraceHandle`  | The `2.4s` duration at the right of the action row; opens the timeline. |
| `TurnTracePanel`   | The timeline itself — every phase of the turn with its stamp.           |
| `TurnTraceFailure` | The failed turn's whole body: frayed rail, verdict, `Retry`.            |

See [Turn status and errors](#turn-status-and-errors) for the design rule these
three encode.

**Layout and chrome**

| Component                      | What it is                                                                                                                                                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SideTabRail` / `SideTabPanel` | Vertical icon rail with slide-in panels. Generic — a tab is an id + icon + label (+ optional count badge), and the host supplies the panel content.                                                                                 |
| `ResizableColumn`              | A right-hand column with a drag handle on its left edge, for splitting a card into chat + document panes. Clamps so the sibling column keeps `minRemainder` px. Used by both the demo's reference pane and the widget's split view. |
| `ResizeHandle`                 | The grip itself. Presentational only — state lives in `useResizablePanel`.                                                                                                                                                          |
| `ScrollToBottomButton`         | The "New messages" pill shown once the reader scrolls away from a stream. Presentational only — visibility and the scroll itself come from `useStickToBottom`. Used by both `ConversationView` (demo) and `WidgetPanel`.            |
| `IconButton`                   | Fixed hit boxes, not padding: `sm` 32 (clears WCAG 2.2 SC 2.5.8), `md` 36, `lg` 44 (Apple HIG touch minimum). The glyph can stay as small as the design wants.                                                                      |
| `FiltersPanel`                 | Selected filter chips grouped by facet. Presentational — selection is UI-only.                                                                                                                                                      |
| `RecentChatsPanel`             | Recent conversations to switch between. Presentational — selection is UI-only.                                                                                                                                                      |
| Icons                          | 33 stroke icons as React components (`SendIcon`, `SparkleIcon`, …), all taking `width`/`height`/`className`.                                                                                                                        |

**Widget shell**

| Export         | What it is                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ChatWidget`   | The floating launcher orb plus the pop-in panel. Chat state lives here, and the panel is hidden with CSS rather than unmounted — the conversation and draft survive closing and reopening. |
| `WidgetPanel`  | The panel's interior: header, greeting, conversation, composer, side tabs, split reference view.                                                                                           |
| `mountWidget`  | Mounts `ChatWidget` into a shadow root and returns an `open`/`close`/`setTheme`/`destroy` handle.                                                                                          |
| `useHostTheme` | Follows the host page's `dark` class / OS preference when the widget runs in `auto`.                                                                                                       |

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

| Hook                   | What it does                                                                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useChat(responder)`   | Owns the conversation. Returns `{ messages, busy, send, stop, steer, retry, removeQueued, reset }`, and derives each turn's `TurnTrace` from the event stream.                                            |
| `useSpeechRecognition` | Wraps the browser Speech Recognition API as a toggle. `supported` is `false` where the API is missing, so callers hide the control entirely.                                                              |
| `useAutoGrowTextarea`  | Grows a textarea with its content up to the active cap, recomputing on resize when expanded.                                                                                                              |
| `useHighlights`        | Memoized highlight ranges for the active reference, resolved against the doc text.                                                                                                                        |
| `useResizablePanel`    | Owns a panel's width and the pointer-drag lifecycle. The caller supplies `computeWidth(clientX)`, so the hook stays layout-agnostic. Works inside the widget's shadow root.                               |
| `useStickToBottom`     | Keeps a scroll region pinned to its bottom edge while `contentRef` grows, but only while the reader hasn't scrolled away — tracked via `ResizeObserver`, no app types. Pairs with `ScrollToBottomButton`. |

`useResizablePanel` is the one hook **not** re-exported from `src/lib/index.ts` —
it reaches consumers through `ResizableColumn`. Import it by deep path if you
need it directly.

### Injected context and shared types

| Module          | What it carries                                                                                                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `branding.ts`   | `BrandingProvider` — `appName`, `modelName`, `disclaimer`. The library has no baked-in brand.                                                                                                        |
| `citations.ts`  | `CitationsProvider` — lets a chip deep inside a message open the reference frame owned by the surface, without prop drilling. Defaults to a no-op, so `ChatMessage` renders fine outside a provider. |
| `uiSize.ts`     | `UiSizeProvider` — `'default'` or `'compact'`. The widget wraps its tree in `compact` to shrink fonts, paddings, and controls without touching a single call site.                                   |
| `types.ts`      | `Message`, `TurnTrace`, `TurnStep`, `TurnFault`, `ToolCall`, `Source`, `Highlight`, `Persona`, `ActiveFilter`, `RecentChat`, `SidePanel`.                                                            |
| `highlights.ts` | Resolving highlight phrases to character offsets in source markdown.                                                                                                                                 |
| `brand.css`     | Every colour value, as swappable themes.                                                                                                                                                             |
| `styles.css`    | Tailwind wiring, base layer, and the `.glass` / `.orb` / `.turn-rail` / `.shimmer-text` utilities.                                                                                                   |

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

| Route          | What it is                                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`            | Landing page linking to the demos                                                                                                                   |
| `/chat`        | Full-page assistant — sidebar, streaming, inline citations + reference reader                                                                       |
| `/widget-demo` | A host page ("Alder & Finch") with the chat embedded as a floating widget                                                                           |
| `/mermaid-lab` | **Temporary.** Two mermaid renderers side by side against one diagram corpus. Deleted, along with the losing dependency, once a renderer is picked. |

### Project structure

```
src/
  lib/                     the extractable library — no imports from demo/
    index.ts               public API (barrel)
    engine/                Responder contract, canned + WS responders, wire types
    hooks/                 useChat, useSpeechRecognition, useAutoGrowTextarea, …
    components/            one folder per component
    widget/                ChatWidget, WidgetPanel, mount (shadow root), useHostTheme
    branding.ts            Branding context
    citations.ts           cite-handler context
    uiSize.ts              density context
    types.ts               shared domain shapes
    brand.css / styles.css themes and Tailwind wiring
  demo/                    the Aristotle app that consumes lib/
    App.tsx                full-page chat
    config.ts              Aristotle branding
    personas.ts            persona list
    components/            app chrome — Sidebar, TopBar, Hero, ConversationView, …
    mocks/                 client-side fallback data — cannedTurns, sideTabData
    widget/                Aristotle widget bootstrap (font inject, auto-init, side panels)
    pages/                 LandingPage, WidgetDemoPage
    mermaid-lab/           temporary renderer bake-off
  main.tsx                 router entry
```

---

## Response modes

Two responders behind one `Responder` interface, selected by one environment
variable ([App.tsx](src/demo/App.tsx), [aristotleWidget.tsx](src/demo/widget/aristotleWidget.tsx)):

| `VITE_WS_URL`             | Responder               | Turns come from                      |
| ------------------------- | ----------------------- | ------------------------------------ |
| set (the shipped default) | `createWsResponder`     | `../chat-ws-server/src/scenarios.ts` |
| unset / commented out     | `createCannedResponder` | `src/demo/mocks/cannedTurns.ts`      |

`VITE_WS_URL` is read **only at Vite startup**. Editing `.env.development` needs
a dev-server restart; an HMR reload won't pick it up.

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
toggle, sidebar, demo-features modal, persona menu, resizable reference pane, the
embedded widget, side tabs, and the mermaid lab.

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

| Prompt matches                                                       | Scenario                                                                                                          |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `degraded`, `partial`, `unhealthy`, `issues`                         | Answers fine; one streamed fault + three tallied on the summary, one code reported by both routes to prove dedupe |
| `error`                                                              | Fatal — the stream dies mid-answer (`UPSTREAM_UNAVAILABLE`)                                                       |
| `fail`                                                               | A tool call fails, the model recovers via a second tool                                                           |
| `50` (standalone), `stress`, `many ref`, `lots of ref`               | 50-source corpus                                                                                                  |
| `cite`, `citation`, `reference`, `source`, `budget`, `save`/`saving` | Five-source cited answer                                                                                          |
| `tool`, `search`, `rate`, `market`                                   | Two sequential successful tool calls                                                                              |
| anything else                                                        | Alternates tool-heavy ↔ plain                                                                                     |

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

| Where                 | Values                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Theme class           | `chat-theme-default`, `chat-theme-aristotle1`, `chat-theme-aristotle2` — or the attribute form, `data-chat-theme="aristotle2"` |
| Colour mode           | `dark` / `light` class, on the **same element** as the theme                                                                   |
| Widget script tag     | `data-auto-init`, `data-theme` (`light`/`dark`/`auto`), `data-theme-class`, `data-position` (`bottom-right`/`bottom-left`)     |
| `mountWidget` options | `target`, `theme`, `themeClass`, `position`, `zIndex`                                                                          |
| Env                   | `VITE_WS_URL` — set for the server, unset for canned                                                                           |
| localStorage          | `aristotle-theme`, `sidebar-collapsed`, `demo-features`, `ref-panel-w`                                                         |

`demo-features` is worth remembering: it persists the feature toggles, so a
capability can look "missing" because it was switched off in a previous session.
The modal's **Reset** puts everything back.

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

Both forms work for every theme. Three are shipped:

| Theme                                            | Identity                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `chat-theme-default` (also the no-class default) | PNC retail — `#004c97` blue, `#ef6a00` orange, near-white canvas    |
| `chat-theme-aristotle1`                          | the palette the library shipped with — same blue, lighter `#f7841f` |
| `chat-theme-aristotle2`                          | PNC corporate — `#084d77` / `#001e33` deep navy, same orange        |

Values marked `✔` in `brand.css` are taken from PNC's live stylesheets: the
default's from pnc.com, `aristotle2`'s deep navy from the Corporate &
Institutional page, whose hero band is `#001e33` with pure white on it.

The theme selector and `dark`/`light` must sit on the **same element** —
`brand.css` derives its light and dark tokens on whichever element carries the
theme. `index.html`'s pre-paint script and the widget already do this.

### Which colour means what

The palette reads by one rule:

> **Blue is what you act on. Orange is the system telling you something.**

Blue (`--brand-*`) covers the send and stop buttons, selected rows, the sidebar
avatar, links, and hover affordances. Orange (`--accent-*`) is status only — the
orb, the tool-running dot, the streaming caret, the persona sparkle, check marks,
the side-tab count badge. If you find yourself reaching for accent on something
clickable, that is the signal you want brand instead.

`--brand-solid` / `--on-brand-solid` is the **single** solid brand fill; there is
deliberately no second name for it. It **inverts in dark**: a solid fill has two
contrast constraints at once — the fill against the panel, and the glyph against
the fill — and no blue in the ramp clears both on a dark canvas (`brand-600` is
1.89:1 on the panel, `brand-300` drops a white glyph to 2.41:1). Dark therefore
uses a near-white fill with a deep glyph, the same lift `--rail` and `--tint`
make. Don't "fix" it back to blue.

### The three tiers

| Tier | Where                         | What                                                                                |
| ---- | ----------------------------- | ----------------------------------------------------------------------------------- |
| 1    | a theme block in brand.css    | raw ramps (`--brand-50…950`, `--accent-300…700`, `--danger-*`) + surfaces           |
| 2    | §1/§2 of brand.css            | semantic tokens (`--accent`, `--ink-soft`, `--line`, `--rail`, `--tint`, `--orb-*`) |
| 3    | `@theme inline` in styles.css | Tailwind names — `--color-accent: var(--accent)` → `bg-accent`                      |

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

## Embeddable widget

The widget can be built as a single self-contained IIFE that any page loads with
one script tag:

```sh
npm run build:widget       # → dist-widget/aristotle-widget.js (exposes window.AristotleChat)
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

| Script                   | Does                                           |
| ------------------------ | ---------------------------------------------- |
| `npm run dev`            | Dev server                                     |
| `npm run build`          | Type-check + production build of the demo app  |
| `npm run preview`        | Serve the built demo app                       |
| `npm run build:widget`   | Build the embeddable widget bundle             |
| `npm run preview:widget` | Serve the built widget + its embed test page   |
| `npm run typecheck`      | `tsc -b`                                       |
| `npm run lint`           | oxlint                                         |
| `npm run format`         | Prettier write (`format:check` to verify only) |
