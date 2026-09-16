// Multi-step agentic workflow with a human in the loop.
//
// Three panels: the run outline on the left, the graph in the middle, the
// selected step on the right. Two canvas views behind one toggle — see
// DESIGN.md in this folder for why, and for the zoom tiers.
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ChevronRightIcon, HistoryIcon, MenuIcon } from '../../lib/components/icons'
import { IconButton } from '../../lib/components/icon-button'
import { ThemeToggle } from '../components/ThemeToggle'
import { PanelRightIcon, PauseIcon } from './canvas/icons'
import {
  buildStageEdges,
  buildStageNodes,
  buildStepEdges,
  buildStepNodes,
  CanvasLegend,
  MAX_ZOOM,
  MIN_ZOOM,
  SelectStepProvider,
  StageNode,
  StepNode,
  tierForZoom,
  ZoomCluster,
  type AppNode,
  type StatusMap,
  type View,
} from './canvas'
import { RunSidebar } from './example/RunSidebar'
import { StageLanes } from './example/StageLanes'
import { StepInspector } from './example/StepInspector'
import {
  applyDecision,
  EDGE_SEEDS,
  INITIAL_STATUS,
  STAGE_LAYOUT,
  STAGES,
  STEPS,
} from './example/loanRun'

const nodeTypes = { step: StepNode, stage: StageNode }

/* Never OPEN below the detail tier. The canvas pane is ~718px wide on a 1440
   screen and the run is ~1670px, so an honest fit lands around 38% — correct,
   and unreadable. Clamp the automatic fit and let the reader pan; the fit button
   in the zoom cluster stays unclamped, because asking for the whole run is a
   deliberate act. A run too wide to read here is what Compact view is for. */
const FIT_VIEW = { padding: 0.12, minZoom: 0.72 }

/* Line colours are contrast-checked in both themes — every one clears 3:1
   against the canvas it sits on (WCAG 2.2 SC 1.4.11). Light values are the ones
   measured in DESIGN.md; dark lifts them the way brand.css lifts --rail. */
const EDGE_TOKENS =
  '[--wf-done:#0069aa] [--wf-active:#004c97] [--wf-pending:#6e7882] [--wf-skipped:#828b93] ' +
  'dark:[--wf-done:#7dabdb] dark:[--wf-active:#aecbe9] dark:[--wf-pending:#93a5b6] dark:[--wf-skipped:#6f8296]'

export function WorkflowDemoPage() {
  const [view, setView] = useState<View>('normal')
  const [statuses, setStatuses] = useState<StatusMap>(INITIAL_STATUS)
  const [selectedId, setSelectedId] = useState<string | null>('approve')
  const [runPanelOpen, setRunPanelOpen] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(true)

  const decide = useCallback((decision: 'approved' | 'changes') => {
    setStatuses((s) => applyDecision(s, decision))
  }, [])

  // Picking a step is a request to look at it, so it reopens a closed panel.
  const selectStep = useCallback((id: string | null) => {
    setSelectedId(id)
    if (id) setDetailsOpen(true)
  }, [])

  return (
    <div className="relative flex h-dvh gap-4 overflow-hidden bg-canvas p-4">
      <AmbientGlow />

      {/* Both panels collapse by animating width rather than unmounting, so the
          canvas reflows smoothly and React Flow re-measures as it goes. The
          negative margin swallows the flex gap, otherwise a closed panel leaves
          a 16px dent. The inner fixed width keeps the contents from reflowing
          while the wrapper shrinks. */}
      <div
        className={`shrink-0 overflow-hidden transition-[width,margin] duration-300 ease-out ${
          runPanelOpen ? 'w-72' : '-mr-4 w-0'
        }`}
      >
        <div className="h-full w-72">
          <RunSidebar
            statuses={statuses}
            onOpenApproval={() => selectStep('approve')}
            onCollapse={() => setRunPanelOpen(false)}
          />
        </div>
      </div>

      <main className="glass relative flex min-w-0 flex-1 overflow-hidden rounded-xl">
        {/* @container: the top bar has to respond to THIS column's width, not the
            viewport's — the sidebar and inspector take ~700px of a 1440 screen,
            so a viewport query never fires and the bar overflows the panel. */}
        <div className="@container flex min-w-0 flex-1 flex-col">
          <TopBar
            view={view}
            onView={setView}
            waiting={statuses.approve === 'waiting'}
            runPanelOpen={runPanelOpen}
            onShowRunPanel={() => setRunPanelOpen(true)}
            detailsOpen={detailsOpen}
            onToggleDetails={() => setDetailsOpen((o) => !o)}
          />
          <div className={`relative min-h-0 flex-1 ${EDGE_TOKENS}`}>
            <ReactFlowProvider>
              <WorkflowCanvas
                view={view}
                statuses={statuses}
                selectedId={selectedId}
                onSelect={selectStep}
              />
            </ReactFlowProvider>
          </div>
        </div>

        <div
          className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${
            detailsOpen ? 'w-[400px]' : 'w-0'
          }`}
        >
          <div className="h-full w-[400px]">
            <StepInspector
              stepId={selectedId}
              statuses={statuses}
              onClose={() => setDetailsOpen(false)}
              onDecide={decide}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

function WorkflowCanvas({
  view,
  statuses,
  selectedId,
  onSelect,
}: {
  view: View
  statuses: StatusMap
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const { fitView, getZoom } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  // Read once per rebuild rather than subscribing: this component must not
  // re-render on every frame of a pinch, only the nodes' own tier hook does.
  const [animateEdges, setAnimateEdges] = useState(true)

  const next = useMemo(() => {
    if (view === 'normal') {
      return {
        nodes: buildStepNodes(STEPS, statuses, selectedId) as AppNode[],
        edges: buildStepEdges(EDGE_SEEDS, statuses, animateEdges),
      }
    }
    return {
      nodes: buildStageNodes(STAGES, STEPS, STAGE_LAYOUT, statuses, selectedId) as AppNode[],
      edges: buildStageEdges(STAGES, STEPS, statuses),
    }
  }, [view, statuses, selectedId, animateEdges])

  useEffect(() => {
    setNodes(next.nodes)
    setEdges(next.edges)
  }, [next, setNodes, setEdges])

  // Re-frame when the layout changes under you; the two views are different
  // shapes. Gated on measurement — fitting before React Flow has measured the
  // nodes frames whatever it has so far and leaves half the run off-screen.
  const nodesInitialized = useNodesInitialized()
  useEffect(() => {
    if (!nodesInitialized) return
    fitView({ ...FIT_VIEW, duration: 300 })
  }, [nodesInitialized, view, fitView])

  const onNodeClick = useCallback<NodeMouseHandler<AppNode>>(
    (_, node) => {
      // Stage cards select through their own step rows, so a click on the card
      // itself leaves the selection alone rather than emptying the panel.
      if (node.type === 'step') onSelect(node.id)
    },
    [onSelect],
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
        {view === 'normal' && <StageLanes />}
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
  )
}

function TopBar({
  view,
  onView,
  waiting,
  runPanelOpen,
  onShowRunPanel,
  detailsOpen,
  onToggleDetails,
}: {
  view: View
  onView: (v: View) => void
  waiting: boolean
  runPanelOpen: boolean
  onShowRunPanel: () => void
  detailsOpen: boolean
  onToggleDetails: () => void
}) {
  return (
    <div
      className={`flex h-[72px] shrink-0 items-center gap-3 overflow-hidden border-b border-line pr-5 ${
        runPanelOpen ? 'pl-6' : 'pl-3'
      }`}
    >
      {/* With the run panel collapsed this is the app's top-left corner, which is
          where people reach for the menu. */}
      {!runPanelOpen && (
        <IconButton
          shape="rounded"
          onClick={onShowRunPanel}
          className="shrink-0"
          aria-label="Show run panel"
          title="Show run panel"
        >
          <MenuIcon width={18} height={18} />
        </IconButton>
      )}
      {/* First to go when the column gets tight — the page title says it anyway. */}
      <span className="shrink-0 text-[13px] text-ink-soft @max-[880px]:hidden">Workflows</span>
      <ChevronRightIcon
        width={14}
        height={14}
        className="shrink-0 text-ink-soft @max-[880px]:hidden"
      />
      <h1 className="min-w-0 truncate text-base font-bold tracking-tight text-ink-strong">
        Commercial loan review
      </h1>
      {/* Sheds words, then disappears — the sidebar's "Needs you" count carries
          the same fact, so this is the first thing that can go. */}
      {waiting && (
        <span className="ml-2 inline-flex h-7 shrink-0 items-center gap-2 rounded-full bg-notify/12 px-3 text-xs font-bold whitespace-nowrap text-ink-strong @max-[620px]:hidden">
          <span className="size-2 rounded-full bg-notify" aria-hidden />
          <span className="@max-[760px]:hidden">Waiting on 1 approval</span>
          <span className="@min-[760px]:hidden">1 approval</span>
        </span>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div
          role="group"
          aria-label="Canvas density"
          className="flex shrink-0 rounded-full border border-line bg-tint/5 p-[3px]"
        >
          {(['normal', 'compact'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onView(v)}
              aria-pressed={view === v}
              className={`h-[30px] rounded-full px-4 text-[13px] transition ${
                view === v
                  ? 'bg-panel-solid font-bold text-accent-fg shadow-sm'
                  : 'font-semibold text-ink-soft hover:text-ink-strong'
              }`}
            >
              {v === 'normal' ? 'Normal' : 'Compact'}
            </button>
          ))}
        </div>
        {/* Icon-only: with the toggle, the theme switch and a status pill already
            in here, labelled buttons don't fit the column at any useful width. */}
        <IconButton
          shape="rounded"
          aria-label="Run log"
          title="Run log"
          className="@max-[560px]:hidden"
        >
          <HistoryIcon width={16} height={16} />
        </IconButton>
        <IconButton
          shape="rounded"
          aria-label="Pause run"
          title="Pause run"
          className="@max-[560px]:hidden"
        >
          <PauseIcon width={16} height={16} />
        </IconButton>
        {/* Deliberately never hidden: a narrow window is exactly when someone
            wants the 400px details panel back. */}
        <IconButton
          shape="rounded"
          onClick={onToggleDetails}
          active={detailsOpen}
          aria-pressed={detailsOpen}
          aria-label={detailsOpen ? 'Hide step details' : 'Show step details'}
          title={detailsOpen ? 'Hide step details' : 'Show step details'}
        >
          <PanelRightIcon width={16} height={16} />
        </IconButton>
        <ThemeToggle />
      </div>
    </div>
  )
}

/** Same wash the rest of the app uses. */
function AmbientGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        background: `radial-gradient(60rem 40rem at 80% -10%, var(--canvas-glow-a), transparent 60%),
          radial-gradient(50rem 35rem at -10% 110%, var(--canvas-glow-b), transparent 60%)`,
      }}
    />
  )
}
