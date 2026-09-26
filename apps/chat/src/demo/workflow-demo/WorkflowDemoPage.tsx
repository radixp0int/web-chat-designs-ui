// Multi-step agentic workflow with a human in the loop.
//
// Three panels plus a log drawer: the run outline on the left, the graph in the
// middle, the selected step on the right, and what the backend is doing
// underneath. Two canvas views behind one toggle — see DESIGN.md in this folder
// for why, for the zoom tiers, and for the source seam this page sits on.
//
// The page holds no run content of its own. Everything it draws arrives from a
// `RunSource`: the hard-coded loan run on /workflow-demo, a WebSocket server on
// /workflow-live. That is the same shape `Responder` gives the chat demo. What
// is left here is composition and selection — the canvas, the top bar and each
// panel live in their own files.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ReactFlowProvider } from '@xyflow/react'
import { AmbientGlow } from '@chat/ui'
import { EDGE_TOKENS, WorkflowCanvas } from './WorkflowCanvas'
import { WorkflowSkeleton } from './WorkflowSkeleton'
import { CollapsiblePanel } from './panels/CollapsiblePanel'
import { RunLog } from './panels/RunLog'
import { RunSidebar, type NeedsItem } from './panels/RunSidebar'
import { RunTopBar } from './panels/RunTopBar'
import { StageInspector } from './panels/StageInspector'
import { StepDetail } from './panels/StepDetail'
import { StepInspector } from './panels/StepInspector'
import { useRun, type Decision, type RunSource } from './run'
import type { StepSeed, View } from './canvas'
import type { RunDetail } from './run/wireProtocol'

export function WorkflowDemoPage({ source }: { source: RunSource }) {
  const run = useRun(source)
  const { graph, statuses, phase, awaiting, decisionsFor, busyStepId } = run

  const [view, setView] = useState<View>('normal')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  /* Whether the selection is the reader's own. A run that stops to ask a
     question should bring the panel with it — but not out from under someone
     who went looking at a different step. */
  const [userPicked, setUserPicked] = useState(false)
  /* Which stage is being looked at. It follows the selected step, so the canvas
     highlight always agrees with the panel — but framing does not (see
     `stageFocusSeq`), because a live run moves the selection on its own. */
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const [stageFocusSeq, setStageFocusSeq] = useState(0)
  /* Which of the two the details panel is answering. A discriminator rather
     than clearing `selectedId`: doing that rebuilt every step node on a stage
     click, which resets React Flow's measurements and delayed — sometimes
     swallowed — the fit that click asked for. */
  const [panelShows, setPanelShows] = useState<'step' | 'stage'>('step')
  const [runPanelOpen, setRunPanelOpen] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [logOpen, setLogOpen] = useState(false)
  /* The selected step, shown as a page instead of in the panel. A boolean, not
     a second id: it is always the step the panel is on, so the two can never
     disagree about what is being decided. */
  const [expanded, setExpanded] = useState(false)

  const stageOf = useCallback(
    (stepId: string | null) => (stepId && graph?.stepById.get(stepId)?.stageId) || null,
    [graph],
  )

  // Picking a step is a request to look at it, so it reopens a closed panel.
  // The stage highlight follows, so the canvas agrees with the panel.
  const selectStep = useCallback(
    (id: string | null) => {
      setSelectedId(id)
      setSelectedStageId(stageOf(id))
      setPanelShows('step')
      setUserPicked(id !== null)
      setExpanded(false)
      if (id) setDetailsOpen(true)
    },
    [stageOf],
  )

  /* Opening a step from the sidebar also frames its stage. `selectStep` on its
     own deliberately does not — a live run moves the selection by itself, and
     framing on every selection change would yank the viewport several times a
     second (see `stageFocusSeq` in WorkflowCanvas). But a click in "Needs you"
     is a deliberate act, exactly like a click on a stage row, so it gets the
     same treatment: the stage lights up AND the canvas goes there. */
  const openStepFromSidebar = useCallback(
    (id: string) => {
      selectStep(id)
      setStageFocusSeq((n) => n + 1)
    },
    [selectStep],
  )

  /* Picking a stage clears the step, so the panel shows the stage rather than
     leaving an unrelated step open beside it. Bumping the sequence is what asks
     the canvas to re-frame — only ever from a deliberate click. */
  const selectStage = useCallback(
    (id: string) => {
      // Computed here rather than inside the updater: React may invoke an
      // updater twice, and setState from within one is a side effect.
      const next = selectedStageId === id ? null : id
      setSelectedStageId(next)
      setPanelShows(next ? 'stage' : 'step')
      setUserPicked(true)
      setStageFocusSeq((n) => n + 1)
      setExpanded(false)
      setDetailsOpen(true)
    },
    [selectedStageId],
  )

  // A new graph gets the step it nominates, and hands the choice back.
  const focusStepId = graph?.focusStepId
  const epoch = graph?.epoch
  useEffect(() => {
    setSelectedId(focusStepId ?? null)
    setSelectedStageId(stageOf(focusStepId ?? null))
    setPanelShows('step')
    setUserPicked(false)
  }, [focusStepId, epoch, stageOf])

  // The first step to stop and ask for a person takes the panel, unless the
  // reader has since gone looking somewhere themselves.
  const firstAwaiting = awaiting[0]
  useEffect(() => {
    if (!firstAwaiting || userPicked) return
    setSelectedId(firstAwaiting)
    setSelectedStageId(stageOf(firstAwaiting))
    setDetailsOpen(true)
  }, [firstAwaiting, userPicked, stageOf])

  /* Every step at `waiting`, not the one step named `approve`: a run can stop on
     two approvals at once, and naming the step made the second one invisible. */
  const needs = useMemo<NeedsItem[]>(
    () =>
      awaiting.map((id) => {
        const step = graph?.stepById.get(id)
        // Two facts, joined — not a sentence. A due label is written for the
        // node's status marker ("3h 40m", "Today"), so anything that prefixes it
        // with "in" reads wrong for half the runs that use it.
        const sub = [step?.assignee, step?.statusLabel && `due ${step.statusLabel}`]
          .filter(Boolean)
          .join(' · ')
        return { stepId: id, title: step?.title ?? id, sub: sub || (step?.meta ?? '') }
      }),
    [awaiting, graph],
  )

  /* What a yes sets running, for the expanded view's "Next if approved". Two
     hops rather than one, because the interesting answer is usually a pair — the
     agent that drafts and the call that sends — and capped so a fan-out cannot
     turn a decision aid into a list. Edge rules are deliberately not consulted:
     a rule governs how an edge is DRAWN, not whether the step is downstream. */
  const nextSteps = useMemo(() => {
    if (!graph || !selectedId) return []
    const out: StepSeed<RunDetail>[] = []
    const seen = new Set([selectedId])
    let frontier = [selectedId]
    for (let hop = 0; hop < 2 && out.length < 4; hop++) {
      const reached = graph.edges.filter((e) => frontier.includes(e.from)).map((e) => e.to)
      frontier = []
      for (const id of reached) {
        if (seen.has(id) || out.length >= 4) continue
        seen.add(id)
        const step = graph.stepById.get(id)
        if (!step) continue
        out.push(step)
        frontier.push(id)
      }
    }
    return out
  }, [graph, selectedId])

  const stepTitles = useMemo(() => {
    const map = new Map<string, string>()
    graph?.steps.forEach((s) => map.set(s.id, s.title))
    return map
  }, [graph])

  const selectedStep = (selectedId && graph?.stepById.get(selectedId)) || null
  const selectedStage =
    panelShows === 'stage' && selectedStageId
      ? (graph?.stages.find((st) => st.id === selectedStageId) ?? null)
      : null
  const stageSteps = useMemo(
    () => (selectedStage ? (graph?.steps.filter((s) => s.stageId === selectedStage.id) ?? []) : []),
    [selectedStage, graph],
  )

  const onDecide = useCallback(
    (decision: Decision, note?: string) => {
      if (selectedId) run.decide(selectedId, decision, note)
    },
    [run, selectedId],
  )

  // No graph yet. That is the skeleton's job — unless the reason there is no
  // graph is that nothing is going to send one, in which case say so instead of
  // spinning forever.
  if (!graph) {
    return run.error ? <RunUnavailable message={run.error.message} /> : <WorkflowSkeleton />
  }

  return (
    <div className="relative flex h-dvh gap-4 overflow-hidden bg-canvas p-4">
      <AmbientGlow />

      <CollapsiblePanel open={runPanelOpen} width="w-72" gutter="-mr-4">
        <RunSidebar
          header={graph.header}
          actor={graph.actor}
          stages={graph.stages}
          needs={needs}
          selectedStageId={selectedStageId}
          onSelectStage={selectStage}
          variants={run.variants}
          variantId={graph.variantId}
          onVariant={run.start}
          onOpenStep={openStepFromSidebar}
          selectedStepId={selectedId}
          onCollapse={() => setRunPanelOpen(false)}
        />
      </CollapsiblePanel>

      <main className="glass relative flex min-w-0 flex-1 overflow-hidden rounded-xl">
        {/* @container: the top bar has to respond to THIS column's width, not the
            viewport's — the sidebar and inspector take ~700px of a 1440 screen,
            so a viewport query never fires and the bar overflows the panel. */}
        <div className="@container flex min-w-0 flex-1 flex-col">
          <RunTopBar
            title={graph.title}
            view={view}
            onView={setView}
            waitingCount={awaiting.length}
            phase={phase}
            onControl={run.control}
            runPanelOpen={runPanelOpen}
            onShowRunPanel={() => setRunPanelOpen(true)}
            detailsOpen={detailsOpen}
            onToggleDetails={() => setDetailsOpen((o) => !o)}
            logOpen={logOpen}
            onToggleLog={() => setLogOpen((o) => !o)}
          />
          {run.error && (
            <div className="shrink-0 border-b border-line bg-danger-fg/8 px-6 py-2 text-[13px] text-danger-fg">
              {run.error.message}
            </div>
          )}
          <div className={`relative min-h-0 flex-1 ${EDGE_TOKENS}`}>
            <ReactFlowProvider>
              <WorkflowCanvas
                graph={graph}
                view={view}
                statuses={statuses}
                selectedId={selectedId}
                onSelect={selectStep}
                selectedStageId={selectedStageId}
                onSelectStage={selectStage}
                stageFocusSeq={stageFocusSeq}
              />
            </ReactFlowProvider>
          </div>
          <RunLog
            entries={run.log}
            trimmed={run.logTrimmed}
            open={logOpen}
            stepTitles={stepTitles}
            onSelectStep={selectStep}
            onClose={() => setLogOpen(false)}
          />
        </div>

        {expanded && selectedStep && (
          <StepDetail
            step={selectedStep}
            status={selectedId ? statuses[selectedId] : undefined}
            runTitle={graph.title}
            next={nextSteps}
            decisions={(selectedId && decisionsFor[selectedId]) || []}
            busy={busyStepId === selectedId}
            onClose={() => setExpanded(false)}
            onDecide={onDecide}
          />
        )}

        <CollapsiblePanel open={detailsOpen} width="w-[400px]">
          {selectedStage ? (
            <StageInspector
              stage={selectedStage}
              steps={stageSteps}
              statuses={statuses}
              selectedStepId={selectedId}
              onSelectStep={selectStep}
              onClose={() => setDetailsOpen(false)}
            />
          ) : (
            <StepInspector
              step={selectedStep}
              status={selectedId ? statuses[selectedId] : undefined}
              decisions={(selectedId && decisionsFor[selectedId]) || []}
              busy={busyStepId === selectedId}
              onClose={() => setDetailsOpen(false)}
              onExpand={() => setExpanded(true)}
              onDecide={onDecide}
            />
          )}
        </CollapsiblePanel>
      </main>
    </div>
  )
}

/** Shown instead of the skeleton when the run is never going to arrive. */
function RunUnavailable({ message }: { message: string }) {
  return (
    <div className="relative flex h-dvh items-center justify-center overflow-hidden bg-canvas p-6">
      <AmbientGlow />
      <div className="glass flex max-w-md flex-col items-center gap-3 rounded-xl px-8 py-10 text-center">
        <span className="orb block size-10 rounded-full opacity-50" aria-hidden />
        <h1 className="text-base font-bold tracking-tight text-ink-strong">No run to show</h1>
        <p className="text-[13px] leading-[21px] text-pretty text-ink-soft">{message}</p>
        <Link
          to="/workflow-demo"
          className="mt-1 text-[13px] font-semibold text-accent-fg underline-offset-2 hover:underline"
        >
          Open the hard-coded run instead
        </Link>
      </div>
    </div>
  )
}
