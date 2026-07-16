# chat-interfaces

A chat UI built as a **reusable, brand-agnostic component library** (`src/lib`)
with a **demo app** (`src/demo`) that wires it up as the fictional "Aristotle"
assistant. React 19 + Vite + Tailwind v4.

## Quick start

```sh
npm install
npm run dev        # http://localhost:5173
```

By default the demo streams from a mock WebSocket server (see
[Response modes](#response-modes)); with it turned off it falls back to a
built-in canned responder, so `npm run dev` works on its own.

## Demos

Three routes, all served by `npm run dev`:

| Route          | What it is                                                                        |
| -------------- | --------------------------------------------------------------------------------- |
| `/`            | Landing page with links to the two demos                                          |
| `/chat`        | Full-page assistant — sidebar, streaming, inline citations + reference reader     |
| `/widget-demo` | A foreign host page ("Alder & Finch") with the chat embedded as a floating widget |

## Project structure

```
src/
  lib/                     the extractable library — no imports from demo/
    index.ts               public API (barrel)
    branding.ts            Branding context (host injects the product name/copy)
    types.ts               Persona, ActiveFilter, RecentChat, SidePanel
    engine/                chatEngine (Responder contract), wsProtocol, wsResponder
    hooks/                 useChat, useSpeechRecognition, useAutoGrowTextarea
    components/            primitives — Composer, ChatMessage, ReferencePanel, IconButton, …
    widget/                ChatWidget, WidgetPanel, mount (shadow-root), useHostTheme
    styles.css             Tailwind theme, design tokens, .glass/.orb utilities
  demo/                    the Aristotle app that consumes lib/
    App.tsx                full-page chat
    config.ts              Aristotle branding
    personas.ts            persona list
    components/            app chrome — Sidebar, TopBar, Hero, ConversationView, …
    mocks/                 client-side fallback data — cannedTurns, sideTabData
    widget/                Aristotle widget bootstrap (font inject, auto-init, side panels)
    pages/                 LandingPage, WidgetDemoPage
  main.tsx                 router entry
```

The library is brand-agnostic: the product name comes from a `BrandingProvider`,
personas/starters/side-panels are injected as props, and the widget shell takes
its responder and content from the host. The demo supplies all of that.

## Response modes

The demo needs something to stream responses. Two options:

- **Mock WebSocket server** (default) — the source of truth for demo responses.
  Richer streams (tool calls, recovery, fatal errors, large citation corpora)
  live in the sibling repo [`../chat-ws-server`](../chat-ws-server).
  `.env.development` points the app at it via `VITE_WS_URL=ws://localhost:8787`.
- **Canned responder** (no server) — comment out / remove `VITE_WS_URL` and the
  app replays a small set of built-in turns from `src/demo/mocks/cannedTurns.ts`.
  This is a convenience fallback only; the server's scenarios are the fuller set.

To run against the server:

```sh
# terminal 1 — ../chat-ws-server
npm install && npm run dev        # ws://localhost:8787

# terminal 2 — here
npm run dev
```

The wire protocol is defined in `src/lib/engine/wsProtocol.ts`, kept a verbatim
copy of the server's `src/types.ts`. See the server's README for scenarios and
the demo prompt keywords (`error`, `fail`, `tool`).

## Embeddable widget

The widget can be built as a single self-contained IIFE that any page loads with
one script tag:

```sh
npm run build:widget       # → dist-widget/aristotle-widget.js (exposes window.AristotleChat)
npm run preview:widget
```

```html
<script src="/aristotle-widget.js" data-auto-init data-theme="auto"></script>
```

All widget DOM lives in a shadow root, so host-page CSS can't restyle it and its
Tailwind styles can't leak out. Module consumers can instead
`import { init } from '.../aristotleWidget'` and call `init(options)`.

## Scripts

| Script                 | Does                                           |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Dev server                                     |
| `npm run build`        | Type-check + production build of the demo app  |
| `npm run build:widget` | Build the embeddable widget bundle             |
| `npm run typecheck`    | `tsc -b`                                       |
| `npm run lint`         | oxlint                                         |
| `npm run format`       | Prettier write (`format:check` to verify only) |
