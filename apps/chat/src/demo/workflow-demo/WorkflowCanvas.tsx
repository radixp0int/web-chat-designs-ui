// The graph itself: React Flow, the two view shapes, and the zoom behaviour.
//
// Split out of the page because it is the one part with its own render budget —
// it rebuilds nodes and edges on every status change, and a live run changes
// statuses several times a second. Everything here is driven by the `graph` prop,
// so it neither knows nor cares whether that came from a server or a fixture.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  buildStageEdges,
  buildStageNodes,
  buildStepEdges,
  buildStepNodes,
  CanvasLegend,
  MAX_ZOOM,
  MIN_ZOOM,
  SelectStageProvider,
  SelectStepProvider,
  StageNode,
  StepNode,
  tierForZoom,
  ZoomCluster,
  type AppNode,
  type StatusMap,
  type View,
} from './canvas'
import { StageLanes } from './panels/StageLanes'
import type { RunGraph } from './run'

const nodeTypes = { step: StepNode, stage: StageNode }

/* Never OPEN below the detail tier. The canvas pane is ~718px wide on a 1440
   screen and the run is ~1670px, so an honest fit lands around 38% — correct,
   and unreadable. Clamp the automatic fit and let the reader pan; the fit button
   in the zoom cluster stays unclamped, because asking for the whole run is a
   deliberate act. A run too wide to read here is what Compact view is for. */
const FIT_VIEW = { padding: 0.12, minZoom: 0.72 }

/* Line colours are contrast-checked in both themes — every one clears 3:1
   against the canvas it sits on (WCAG 2.2 SC 1.4.11). Light values are the ones
   measured in DESIGN.md; dark lifts them the way brand.css lifts --rail.
   The kit reads these as CSS variables, so the host is what sets them. */
export const EDGE_TOKENS =
  '[--wf-done:#0069aa] [--wf-active:#004c97] [--wf-pending:#6e7882] [--wf-skipped:#828b93] ' +
  'dark:[--wf-done:#7dabdb] dark:[--wf-active:#aecbe9] dark:[--wf-pending:#93a5b6] dark:[--wf-skipped:#6f8296]'

export function WorkflowCanvas({
  graph,
  view,
  statuses,
  selectedId,
  onSelect,
  selectedStageId,
  onSelectStage,
  stageFocusSeq,
}: {
  graph: RunGraph
  view: View
  statuses: StatusMap
  selectedId: string | null
  onSelect: (id: string | null) => void
  /** The stage being looked at — highlighted, but not re-framed on its own. */
  selectedStageId: string | null
  onSelectStage: (id: string) => void
  /**
   * Bumped only when someone deliberately picks a stage. Framing keys on this
   * rather than on `selectedStageId`, because that id also moves when a step is
   * selected — including by a live run reaching a gate, which must not yank the
   * viewport while you are reading something else.
   */
  stageFocusSeq: number
}) {
  const { fitView, getZoom } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  // Read once per rebuild rather than subscribing: this component must not
  // re-render on every frame of a pinch, only the nodes' own tier hook does.
  const [animateEdges, setAnimateEdges] = useState(true)

  /* One memo per view rather than one with a branch. The two depend on
     different things — only the compact view's cards care which stage is
     selected — and a single memo would rebuild every step node whenever the
     selected stage changed, for a view where it changes nothing. That rebuild
     is not free: new node objects reset React Flow's measurements, which flips
     `useNodesInitialized()` and re-triggers the framing effects below, so the
     stage fit ended up fighting a whole-run fit it had just asked for. */
  const stepGraph = useMemo(
    () => ({
      nodes: buildStepNodes(graph.steps, statuses, selectedId) as AppNode[],
      edges: buildStepEdges(graph.edges, statuses, animateEdges),
    }),
    [graph, statuses, selectedId, animateEdges],
  )

  const stageGraph = useMemo(
    () => ({
      nodes: buildStageNodes(
        graph.stages,
        graph.steps,
        graph.stageLayout,
        statuses,
        selectedId,
        selectedStageId,
      ) as AppNode[],
      edges: buildStageEdges(graph.stages, graph.steps, statuses),
    }),
    [graph, statuses, selectedId, selectedStageId],
  )

  const next = view === 'normal' ? stepGraph : stageGraph

  useEffect(() => {
    setNodes(next.nodes)
    setEdges(next.edges)
  }, [next, setNodes, setEdges])

  // Re-frame when the layout changes under you; the two views are different
  // shapes. Gated on measurement — fitting before React Flow has measured the
  // nodes frames whatever it has so far and leaves half the run off-screen.
  //
  // Keyed on `epoch`, not on the nodes: a live run changes statuses several
  // times a second, and refitting on each one would pan the canvas out from
  // under the reader. Only a whole new graph is worth re-framing for.
  const nodesInitialized = useNodesInitialized()
  const framedShape = useRef('')
  useEffect(() => {
    if (!nodesInitialized) return
    // `nodesInitialized` flips back to false every time the node objects are
    // rebuilt — which is every status change, several times a second in a live
    // run — so it cannot be the trigger on its own, only the gate. Remembering
    // what has already been framed is what stops this re-framing the canvas
    // under the reader, and what stops it stamping on the stage fit below, which
    // it otherwise overrode about 40ms later.
    const shape = `${graph.epoch}:${view}`
    if (framedShape.current === shape) return

    // Recorded when a fit actually lands, not when one is asked for. A fit into
    // a pane with no width yet — which is how the live route starts, since the
    // graph arrives after the first paint — resolves false, and claiming the
    // shape up front would make that wasted attempt the only one.
    //
    // Deliberately not cancelled when this effect re-runs: it re-runs on every
    // node rebuild, so a cancelled callback never lands, the shape is never
    // recorded, and the run gets re-framed on top of whatever the reader just
    // asked for — which is exactly how this used to stamp on the stage fit
    // below, about 40ms after it. Repeat calls are harmless; they are the same
    // target, and they stop as soon as one succeeds.
    void fitView({ ...FIT_VIEW, duration: 300 }).then((ok) => {
      if (ok) framedShape.current = shape
    })
  }, [nodesInitialized, view, graph.epoch, fitView])

  /* Frame the stage someone just picked. Skipped on the first render — there is
     nothing to return to yet, and the initial fitView has the job. */
  const framedSeq = useRef(stageFocusSeq)
  useEffect(() => {
    if (stageFocusSeq === framedSeq.current) return

    const ids = !selectedStageId
      ? []
      : view === 'compact'
        ? [`stage-${selectedStageId}`]
        : graph.steps.filter((s) => s.stageId === selectedStageId).map((s) => s.id)

    // Deselecting a stage, or one with nothing in it, is still an answered
    // request — otherwise a later re-render would treat it as outstanding.
    if (ids.length === 0) {
      framedSeq.current = stageFocusSeq
      return
    }

    // Recorded on success, like the fit above, so an attempt made while React
    // Flow is between measurements is retried rather than swallowed.
    void fitView({
      nodes: ids.map((id) => ({ id })),
      // Looser than the whole-run fit and allowed to go closer: a single stage
      // is a handful of nodes, and the point of picking one is to read it.
      padding: 0.3,
      minZoom: 0.72,
      maxZoom: 1,
      duration: 400,
    }).then((ok) => {
      if (ok) framedSeq.current = stageFocusSeq
    })
  }, [stageFocusSeq, selectedStageId, view, graph, nodesInitialized, fitView])

  const onNodeClick = useCallback<NodeMouseHandler<AppNode>>(
    (_, node) => {
      if (node.type === 'step') onSelect(node.id)
      // A stage card's own rows pick a step; the card itself picks the stage.
      else if (node.type === 'stage') onSelectStage(node.id.replace(/^stage-/, ''))
    },
    [onSelect, onSelectStage],
  )

  const handleMove = useCallback(() => {
    const tier = tierForZoom(getZoom())
    // Dropping the dash animation below the detail tier is the single biggest
    // win when zoomed out — it repaints every frame, for every active edge.
    setAnimateEdges((on) => (on === (tier === 'detail') ? on : tier === 'detail'))
  }, [getZoom])

  const interactive = animateEdges

  return (
    // Reaches the custom nodes, which React Flow renders itself.
    <SelectStageProvider value={onSelectStage}>
      <SelectStepProvider value={onSelect}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={() => onSelect(null)}
          onMove={handleMove}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onlyRenderVisibleElements
          nodesDraggable={interactive}
          nodesConnectable={false}
          elevateNodesOnSelect={false}
          fitView
          fitViewOptions={FIT_VIEW}
          className="!bg-transparent"
        >
          {view === 'normal' && (
            <StageLanes
              stages={graph.stages}
              lanes={graph.lanes}
              top={graph.laneTop}
              bottom={graph.laneBottom}
              selectedStageId={selectedStageId}
              onSelectStage={onSelectStage}
            />
          )}
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.2}
            color="color-mix(in srgb, var(--ink-soft) 40%, transparent)"
          />
          <CanvasLegend />
          <ZoomCluster />
        </ReactFlow>
      </SelectStepProvider>
    </SelectStageProvider>
  )
}
