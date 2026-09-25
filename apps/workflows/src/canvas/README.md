# Workflow canvas kit

A React Flow canvas for multi-step agentic runs with a human in the loop: nodes
that say who does the work, two densities, and level-of-detail as you zoom out.

Nothing here imports from `../example` or from the host app. It depends on React,
React Flow, and `@chat/ui` icons for a handful of shared glyphs. Copy the
folder, supply your own run, and you have a canvas.

## What you supply

| You provide                  | Shape                         |
| ---------------------------- | ----------------------------- |
| Steps, with x/y positions    | `StepSeed<YourDetail>[]`      |
| Stages                       | `StageSeed[]`                 |
| Stage card positions         | `Record<string, StageLayout>` |
| Edges                        | `EdgeSeed[]`                  |
| Which step is at what status | `StatusMap`                   |

`detail` is yours — the canvas carries it to your panel and never reads inside
it, so `StepSeed<T>` takes whatever shape your inspector wants.

## The shortest host

```tsx
import { ReactFlow, ReactFlowProvider } from '@xyflow/react'
import {
  buildStepEdges, buildStepNodes, CanvasLegend, MAX_ZOOM, MIN_ZOOM,
  SelectStepProvider, StageNode, StepNode, ZoomCluster,
} from './canvas'

const nodeTypes = { step: StepNode, stage: StageNode }

<div className="[--wf-done:#0069aa] [--wf-active:#004c97] [--wf-pending:#6e7882] [--wf-skipped:#828b93]">
  <ReactFlowProvider>
    <SelectStepProvider value={setSelectedId}>
      <ReactFlow
        nodes={buildStepNodes(STEPS, statuses, selectedId)}
        edges={buildStepEdges(EDGE_SEEDS, statuses, true)}
        nodeTypes={nodeTypes}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        onlyRenderVisibleElements
      >
        <CanvasLegend />
        <ZoomCluster />
      </ReactFlow>
    </SelectStepProvider>
  </ReactFlowProvider>
</div>
```

## Four things that will bite you

1. **The line colours are CSS variables** (`--wf-done` and friends), so the host
   sets them per theme. Unset, every edge is invisible. The values above are
   contrast-checked; see `../DESIGN.md` before changing them.
2. **Words that are situational are data, not vocabulary.** Status _names_
   ("Queued") have defaults in `StatusMark`; a countdown or an assignee comes in
   as `statusLabel` / `assignee` on the step. Don't hardcode them into a node.
3. **`useZoomTier()` returns a bucket, not the zoom**, so nodes re-render when
   the tier changes rather than on every frame of a pinch. Keep node components
   `memo`'d, and drop the edge dash animation below the detail tier.
4. **Clickable things inside a node need `nodrag`** plus `stopPropagation`, or
   mousedown drags the node and the canvas's own click handler fires after yours.

## Colours

Everything else is a semantic token from `brand.css` in @chat/tokens (`--panel-solid`,
`--ink-strong`, `--notify`), so the kit themes light and dark with the host and
carries no palette of its own. Orange means one thing only: a person is being
waited on.
