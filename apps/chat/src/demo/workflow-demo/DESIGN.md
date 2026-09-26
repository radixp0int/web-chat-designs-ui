# Workflow canvas — design notes

A multi-step agentic run with a human in the loop. The rules below are the ones
that are easy to break by accident; everything else follows the app's usual
tokens in [brand.css](../../../../../packages/tokens/src/brand.css).

For _what the demo does_ rather than why, see [README.md](./README.md).

## Four parts

| Folder                | What it is                                                           |
| --------------------- | -------------------------------------------------------------------- |
| [canvas/](./canvas)   | The portable kit — nodes, edges, zoom tiers, chrome. No example.     |
| [run/](./run)         | Where a run comes from: wire types, layout, reducer, two sources.    |
| [panels/](./panels)   | The host's own chrome — sidebar, top bar, inspector, lanes, run log. |
| [example/](./example) | The hard-coded loan run.                                             |

[WorkflowDemoPage.tsx](./WorkflowDemoPage.tsx) is composition and selection only;
[WorkflowCanvas.tsx](./WorkflowCanvas.tsx) holds React Flow, because it is the
one part with a render budget worth keeping in view.

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
Below `INITIALS_MIN` in [KindIcon.tsx](./canvas/KindIcon.tsx) the avatar falls back to a
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

## The source seam

The page holds no run content. It takes a `RunSource` and draws whatever comes
out of it — the same shape `Responder` gives the chat demo in
[chatEngine.ts](../../../../../packages/chat-ui/src/engine/chatEngine.ts) in `@chat/chat-ui`.

| Route            | Source                    | Server                           |
| ---------------- | ------------------------- | -------------------------------- |
| `/workflow-demo` | `createStaticRunSource()` | none                             |
| `/workflow-live` | `wsRunSource(url)`        | `../../../../workflow-ws-server` |

A source pushes `RunEvent`s at a pure reducer ([runReducer.ts](./run/runReducer.ts)).
Two of its rules are there for performance and are easy to undo by accident:

- **`statuses` keeps its object identity when a patch changes no status.** The
  canvas memoises its whole node and edge build on that object, and most patches
  during a live run are meta- or detail-only. Returning a fresh map each time
  rebuilds the graph several times a second for no visible change.
- **`graph.epoch` moves only on a snapshot**, and `fitView` keys on it. Refitting
  whenever the node data changes would pan the canvas out from under the reader
  while they read.

The graph also arrives **whole**, with steps that will never run already at
`skipped` — the way `senior` has always shipped. A node set that changes mid-run
flips React Flow's `useNodesInitialized()` back to false and re-frames the
viewport. Only a snapshot may change it.

### Two things the wire cannot carry

`EdgeSeed.state` is a _function_, so only the rule crosses (`'feeds'` / `'never'`)
and [wsRunSource.ts](./run/wsRunSource.ts) rehydrates it through the kit's own
`feeds()` and `never`. And steps travel as `{column, row}` rather than pixels;
[layout.ts](./run/layout.ts) derives x and y.

That layout lives in `run/`, not `canvas/`, on purpose: the kit's contract is
"you provide steps with x/y", and this is the thing that provides them.

**The derived positions are not the authored ones.** Fed the loan run's columns,
`placeRun` reproduces its x exactly — `0/300/600/900/1174/1474`, gate narrowing
included — but its y centres each column on an axis, where the authored values
were tuned per node. So `/workflow-demo` and `/workflow-live` are not
pixel-identical, and the static source bypasses `placeRun` altogether to keep the
hand-placed run exactly as it was.

### A person is asked, not told

Which gate is open is **state**, not only the `run.awaiting` event: it rides on
every snapshot. A client attaching to a run that is already waiting has no other
way to learn what that step will accept, and would otherwise draw buttons for a
decision the server will refuse.

Nothing keys on a step _id_ any more. "Needs you" is every step at `waiting`,
because a run can stop on two approvals at once — the onboarding variant does,
and the old single hardcoded card made the second one invisible. For the same
reason the sidebar's stage list is the part that scrolls and "Needs you" is the
part that doesn't.

## Written once

Four things were duplicated across this section and the pages around it, and each
is the kind that drifts silently — one copy ends up semibold, or 10px, or keeps
an old gradient:

| Now in                                                              | Was                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [AmbientGlow](../../../../../packages/ui/src/shell/AmbientGlow.tsx) | Four byte-identical copies across the demo pages                                |
| [SectionLabel](./panels/SectionLabel.tsx)                           | The small-caps heading, written out five times                                  |
| [CollapsiblePanel](./panels/CollapsiblePanel.tsx)                   | The width-animating wrapper, twice, with the explanation only on one            |
| `DECISION_BUTTON` in [StepInspector](./panels/StepInspector.tsx)    | Three near-identical buttons whose alignment depended on which siblings existed |

That last one is worth a note: a gate offers a _subset_ of the three answers, so
the buttons now come off a table and a spacer does the alignment. No button has
to know which of its siblings rendered.

## Picking a stage

A stage is selectable from three places — the outline in the run panel, the lane
header on the canvas, and the stage card in compact view — and all three do the
same thing: highlight it, show it in the details panel, and frame it on the
canvas.

Two facts about a stage look similar and must not be drawn alike. `current` is
where the _run_ has got to; `selected` is where the _reader_ is looking. The
reader's own choice is the louder of the two, and both can be true at once.

**Highlight follows the selection; framing does not.** `selectedStageId` also
moves when a step is selected, so the canvas always agrees with the panel — and a
live run selects steps by itself when it reaches a gate. If framing keyed on that
id, the viewport would jump while you were reading something else. So framing
keys on `stageFocusSeq`, a counter the page bumps only on a deliberate stage
click.

### Two fits that used to fight

The canvas frames in two situations, and getting them to coexist took three
attempts, so the rules are worth writing down:

| Fit           | Fires on                  | Records       |
| ------------- | ------------------------- | ------------- |
| The whole run | `epoch` or `view` changes | `framedShape` |
| One stage     | `stageFocusSeq` changes   | `framedSeq`   |

`useNodesInitialized()` flips back to **false every time the node objects are
rebuilt** — which a live run does several times a second. It is therefore a gate,
never a trigger: keyed on it directly, the whole-run fit re-fired about 40ms
after every stage fit and quietly undid it.

The whole-run fit records its shape **when a fit resolves true**, not when one is
asked for, and deliberately does not cancel that callback when the effect re-runs.
A fit into a pane with no width yet — how the live route starts, since the graph
arrives after the first paint — resolves false, and claiming the shape up front
would make that wasted attempt the only one. Cancelling on re-run has the
opposite failure: the callback never lands, so the shape is never recorded and
the run is re-framed forever.

The node memo is also **split per view**. Only the compact view's cards care
which stage is selected, and one memo with a branch rebuilt every step node on
every stage click — resetting measurements, flipping `useNodesInitialized()`, and
setting the whole fight above in motion.

## The run log

A drawer under the canvas rather than a third column, so a line arriving and the
node it names changing colour are one glance apart. It animates height rather
than unmounting, like both side panels, so React Flow re-measures as it moves.

Two things to know: while closed the container is zero-height, so the
`ResizeObserver` behind `useStickToBottom` never fires and the list would open
scrolled to its oldest line — hence the `scrollToBottom()` on open. And rows key
on `entry.id`, never the index, because the 500-line cap drops from the head.

Log levels are carried by a dot and, for a failure, by the text colour. No
orange: `--notify` means "a person is being waited on", and in this palette it
falls back to `--accent`, so borrowing either would make a human line
indistinguishable from the pill that actually means it.
