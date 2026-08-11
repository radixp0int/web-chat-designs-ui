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
    types.ts               Message, TurnTrace, Persona, ActiveFilter, RecentChat, SidePanel
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

### Testing each state

A failure has two shapes worth looking at, and they come from different sources.

**Failed, with nothing to show** — the default setup, with the server simply not
started. The socket never opens, so the turn dies before doing anything.

```sh
npm run dev          # leave ../chat-ws-server stopped
```

Send anything. There is deliberately **no rail and no timeline** here — a rail
with nothing alongside it is a stray mark, not a timeline — so you should see
only the verdict, the reason, and `Retry`. Confirm `Retry` drops the failed
answer and re-runs the same user turn (it fails again while the server is down;
that's correct).

**Everything else** needs the canned responder, since no live path recovers.
Comment out `VITE_WS_URL` in `.env.development` and **restart** the dev server;
Vite only reads `.env` at startup, so an HMR reload won't pick it up.

```sh
# .env.development
# VITE_WS_URL=ws://localhost:8787
```

Then prompt for each state:

| Prompt matches                    | Gives you                                            |
| --------------------------------- | ---------------------------------------------------- |
| `/hiccup\|recover\|drop\|flaky/i` | `recovered` — drops at 35%, then carries on          |
| `/fail\|fatal\|dead\|break/i`     | `failed` with a timeline — dies at 72%, partial text |
| anything else                     | a clean `ok` turn                                    |
| any turn, then **Stop**           | `stopped`, which is not a fault                      |

Both scripted turns live in `src/demo/mocks/cannedTurns.ts` and are driven by one
field — `fault: { at, message, fatal? }` on `CannedTurn`. They carry a `match`,
so they stay out of the normal rotation and only play on demand.

Two things to check, because they are what the design is for:

- **Recovered shows nothing inline.** The fault is only visible once you open the
  duration handle. If a badge, tint, or warning icon appears on a turn that
  answered fine, that's the bug.
- **The failed turn has no second control.** Its own block owns recovery, so the
  copy / regenerate / vote row is suppressed — a Regenerate button sitting under
  a Retry makes two controls compete for the same job.

**Richer failures** — the mock server has its own `error` and `fail` scenarios
with tool calls in the mix. Use those once the server is running.

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
