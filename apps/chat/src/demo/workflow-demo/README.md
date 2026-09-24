# Workflow demo

A multi-step agentic run on a React Flow canvas, with a human in the loop.

Two routes, one page. The page holds no run content of its own — it takes a
`RunSource` and draws whatever comes out of it, the same shape `Responder` gives
the chat demo.

| Route            | Runs come from                                                        | Needs a server |
| ---------------- | --------------------------------------------------------------------- | -------------- |
| `/workflow-demo` | [example/loanRun.ts](./example/loanRun.ts)                            | No             |
| `/workflow-live` | [workflow-ws-server](../../../../workflow-ws-server) over a WebSocket | Yes, on 8788   |

`/workflow-live` falls back to the hard-coded run — with a banner saying so —
when `VITE_WORKFLOW_WS_URL` is unset, so it is never a blank screen.

For _why_ any of it is built the way it is, see [DESIGN.md](./DESIGN.md). For the
portable canvas kit on its own, see [canvas/README.md](./canvas/README.md).

## What you can do

**Follow a run as it happens.** Steps move through `queued → running → done`,
stages tick over, and the result line under each node fills in as work finishes.

**Read the run log.** A drawer under the canvas (the clock icon in the top bar),
streaming every event the backend reports. Rows that name a step are clickable —
they select it.

**Pick a stage.** From the outline in the run panel, a lane header on the canvas,
or a stage card in compact view. It highlights, opens a stage summary in the
details panel, and frames itself on the canvas. Click it again to clear.

**Answer a gate.** When a run stops on a person, the step lands in "Needs you",
the panel offers whatever that gate accepts — approve, request changes, decline —
and a note goes to the audit trail. On `/workflow-live` the decision travels back
over the socket and decides what the run does next.

**Control the run.** Pause, resume and restart, live.

**Switch density.** _Normal_ is one node per step in stage columns. _Compact_ is
one node per stage — the real performance lever on a big run. Nodes also shed
content as you zoom out rather than shrinking their text.

## The three live variants

Each is a different graph, not the same run with different words.

| Variant           | The run                             | What it is there to show                                                                             |
| ----------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `loan-review`     | Commercial loan, 12 steps           | The baseline: a three-way fan-out, one gate offering all three answers, and a "request changes" loop |
| `incident-triage` | SEV-2 latency incident, 14 steps    | A step that ends **failed while the run carries on**, and a status moving **backwards** for a retry  |
| `onboarding`      | New hire across 5 systems, 16 steps | **Five tools at once** in one column, and **two gates open together** — "Needs you" reads 2          |

## Running it

```sh
# terminal 1 — ../../../../workflow-ws-server
npm install && npm run dev      # ws://localhost:8788

# terminal 2 — the UI
npm run dev                     # http://localhost:5173/workflow-live
```

`VITE_WORKFLOW_WS_URL` in `.env.development` points at the server. Vite reads
`.env` only at startup, so changing it needs a dev-server restart — an HMR reload
won't pick it up. `/workflow-demo` ignores all of this.

## Layout

```
canvas/    the portable kit — nodes, edges, zoom tiers, chrome. No example.
run/       where a run comes from: wire types, layout, reducer, two sources
panels/    host chrome — sidebar, top bar, inspector, lanes, run log
example/   the hard-coded loan run
```

`WorkflowDemoPage.tsx` is composition and selection only; `WorkflowCanvas.tsx`
holds React Flow, because it is the one part with a render budget worth watching.
