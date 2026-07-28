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

| Route          | What it is                                                                    |
| -------------- | ----------------------------------------------------------------------------- |
| `/`            | Landing page with links to the two demos                                      |
| `/chat`        | Full-page assistant — sidebar, streaming, inline citations + reference reader |
| `/widget-demo` | A host page ("Alder & Finch") with the chat embedded as a floating widget     |

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
    brand.css              every color value, as swappable themes (see Theming)
    styles.css             Tailwind wiring, base layer, .glass/.orb utilities
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
personas/starters/side-panels are injected as props, the widget shell takes its
responder and content from the host, and every colour comes from a theme the
host selects (see [Theming](#theming)). The demo supplies all of that.

## Theming

Every colour in the library lives in `src/lib/brand.css`. Components never name
a palette step — they use intent-named utilities (`bg-accent`, `text-ink-soft`,
`border-line`, `hover:bg-tint/8`) that resolve through CSS custom properties, so
a consuming app re-skins the whole UI by setting **one class** (or data
attribute) on its root element.

### Picking a theme

```text
<html class="chat-theme-aristotle2 dark">        <!-- class form -->
<html data-chat-theme="aristotle2" class="dark">  <!-- attribute form -->
```

Both forms work for every theme. Three are shipped:

| Theme                   | Identity                                                            |
| ----------------------- | ------------------------------------------------------------------- |
| default (no class)      | PNC retail — `#004c97` blue, `#ef6a00` orange, near-white canvas    |
| `chat-theme-aristotle1` | the palette the library shipped with — same blue, lighter `#f7841f` |
| `chat-theme-aristotle2` | PNC corporate — `#084d77` / `#001e33` deep navy, same orange        |

Values marked `✔` in `brand.css` are taken from PNC's live stylesheets: the
default's from pnc.com, `aristotle2`'s deep navy from the Corporate &
Institutional page, whose hero band is `#001e33` with pure white on it.

The theme selector and `dark`/`light` must sit on the **same element** —
`brand.css` derives its light and dark tokens on whichever element carries the
theme. `index.html`'s pre-paint script and the widget already do this.

### The three tiers

| Tier | Where                         | What                                                                      |
| ---- | ----------------------------- | ------------------------------------------------------------------------- |
| 1    | a theme block in brand.css    | raw ramps (`--brand-50…950`, `--accent-300…700`, `--danger-*`) + surfaces |
| 2    | §1/§2 of brand.css            | semantic tokens (`--accent`, `--ink-soft`, `--line`, `--tint`, `--orb-*`) |
| 3    | `@theme inline` in styles.css | Tailwind names — `--color-accent: var(--accent)` → `bg-accent`            |

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
<script
  src="/aristotle-widget.js"
  data-auto-init
  data-theme="auto"
  data-theme-class="chat-theme-aristotle2"
></script>
```

All widget DOM lives in a shadow root, so host-page CSS can't restyle it and its
Tailwind styles can't leak out — including the host's theme class, which is why
the palette is passed in via `data-theme-class` / `themeClass` (see
[Theming](#theming)). Module consumers can instead
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
