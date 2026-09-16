# Workflow canvas — design notes

A multi-step agentic run with a human in the loop. The rules below are the ones
that are easy to break by accident; everything else follows the app's usual
tokens in [brand.css](../../lib/brand.css).

## Two halves

| Folder                | What it is                                                       |
| --------------------- | ---------------------------------------------------------------- |
| [canvas/](./canvas)   | The portable kit — nodes, edges, zoom tiers, chrome. No example. |
| [example/](./example) | This run: the loan review, its panels and its layout.            |

`canvas/` imports only React, React Flow and the shared icon set, so it lifts
into a recipe library by copying the folder — see its
[README](./canvas/README.md). The boundary is worth keeping: it is what stops
one example's content from settling into the components again.

The split has a rule behind it. A status **name** ("Queued") is kit vocabulary
and lives in `canvas/types.ts`; a **countdown** or an assignee is one run's
content and arrives on the step as `statusLabel` / `assignee`. Both were
hardcoded in the node components at first, which meant every waiting step in any
workflow claimed to be due in 3h 40m.

## Who does the work is an icon, not a colour

| Kind       | Icon            | Chip                           |
| ---------- | --------------- | ------------------------------ |
| `agent`    | the orb         | `bg-chip text-chip-fg`         |
| `human`    | initials avatar | `bg-brand-solid` — the loudest |
| `tool`     | plug            | neutral `bg-tint/12`           |
| `decision` | diamond         | outline only                   |
| `trigger`  | inbox           | `bg-chip`                      |

A person's step carries the solid chip because it is the one that stops the run.
The icons are also the only thing that survives the deepest zoom tier, so a
reader can still tell agent work from human work at 40%.

**Initials need rendered size, not authored size.** A node avatar is authored at
20px but drawn through React Flow's viewport transform, so at the detail tier's
0.7-1.0 zoom its text reaches the screen at 5-7px. Two letters also have to stay
inside the circle's inscribed square (diameter × 0.707) or they crowd the curve —
"DW" bold measures ~1.86× its font size, so the font is 0.36 × the diameter.
Below `INITIALS_MIN` in [StepNode.tsx](./canvas/KindIcon.tsx) the avatar falls back to a
filled person glyph, which reads at any scale; in practice only the run panel's
34px avatar keeps its letters. The name itself lives in the node's text and the
inspector, where there is room to read it. A _dashed_ outline person is something
else again: a step routed to a role rather than to someone in particular.

## Colour only ever means state

Orange (`--notify`) appears in exactly one situation: **a person is being waited
on**. Nothing decorative may use it.

`--on-notify` is the deep navy, not white. White on that orange is 3.12:1 and
fails the 4.5:1 text bar; the navy is ~5.7:1. brand.css says so at the token —
don't "fix" it to white.

## Zoom: drop content, don't shrink text

At 60% zoom a 13.5px label renders at 8px. So each tier down drops content and
counter-scales what is left ([zoom.ts](./canvas/zoom.ts)):

| Tier         | Zoom    | Shows                                          |
| ------------ | ------- | ---------------------------------------------- |
| `detail`     | 100–70% | everything, plus drag and the approval action  |
| `simplified` | 70–45%  | icon + title at 17px, status marker only       |
| `glyph`      | 45–30%  | icon + status marker, no text                  |
| floor        | 30%     | `minZoom` — below this even icons stop reading |

`useZoomTier()` returns the **bucket**, so a node re-renders when the tier
changes rather than on every frame of a pinch. Node components are `memo`'d.

Other things that come off with the tier: the edge dash animation (it repaints
every frame) and node dragging.

## Connection lines are contrast-checked

Measured against the lightest ground they cross (the tinted current-stage lane).
WCAG 2.2 SC 1.4.11 asks for 3:1, and these are meaningful graphics — the line
style is how the canvas says whether work has flowed through a connection.

| Line                 | Light     | Contrast |
| -------------------- | --------- | -------- |
| Done                 | `#0069aa` | 5.4:1    |
| Waiting on this step | `#004c97` | 7.8:1    |
| Not reached yet      | `#6e7882` | 4.15:1   |
| Skipped branch       | `#828b93` | 3.20:1   |

Solid, not translucent: an alpha stroke changed contrast depending on which lane
it crossed. Skipped stays the faintest by **dot density** (`0.1 7` vs `0.1 5`),
not by fading below the threshold. The dark values live beside the light ones in
`EDGE_TOKENS` in [WorkflowDemoPage.tsx](./WorkflowDemoPage.tsx).

## Two views, one toggle

- **Normal** — stage columns, one node per step. The default.
- **Compact** — one node per stage; finished stages collapse to a step list.

Compact is the real performance lever, not the zoom tiers: the same run is 5
rendered nodes instead of 12 nodes and 15 edges. Worth defaulting to on a tablet.

## Both panels collapse

The run panel collapses from the chevron in its own header and comes back from a
hamburger at the app's top-left corner. The details panel closes from its X or
from the toggle in the top bar, and reopens whenever a step is selected —
choosing a step is a request to look at it.

Both animate width rather than unmounting, so the canvas reflows and React Flow
re-measures as they move. The wrapper carries a negative margin when closed,
otherwise the flex gap leaves a 16px dent where the panel used to be.

## The top bar sheds content in order

It is a `@container`, not a viewport query: the bar sits in a column only ~700px
wide on a 1440 screen, so a viewport breakpoint never fires and the bar overflows
the panel. As the column narrows it drops the breadcrumb, then the status pill's
words, then the pill, then Run log and Pause — and only then does the title
truncate. The details toggle is never dropped: a narrow window is exactly when
someone wants that 400px back.

## Loading

[WorkflowSkeleton.tsx](./WorkflowSkeleton.tsx) is deliberately **outside** the
lazy chunk — a fallback that had to be fetched first would defeat the point. It
draws the same three-panel shell so the layout doesn't jump, and uses the app's
own motion (`animate-orb-drift`, `shimmer-text`, `animate-fade-up`).
