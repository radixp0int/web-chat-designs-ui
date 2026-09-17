// The hard-coded loan run, wearing the RunSource interface.
//
// This is what /workflow-demo runs on, so it needs no server and never changes
// shape. It deliberately does NOT go through layout.ts: the loan run's positions
// were hand-tuned (see ../DESIGN.md), and re-deriving them would move nodes that
// were placed deliberately.
import {
  applyDecision,
  EDGE_SEEDS,
  INITIAL_STATUS,
  STAGE_LANES,
  STAGE_LAYOUT,
  STAGES,
  STEP_BY_ID,
  STEPS,
} from '../example/loanRun'
import type { Decision, LogEntry, RunEvent, RunGraph, RunSource } from './types'

/** The extent the authored positions were drawn against. */
const LANE_TOP = -90
const LANE_BOTTOM = 540

const GRAPH: RunGraph = {
  runId: 'run-4821',
  variantId: 'loan-review',
  title: 'Commercial loan review',
  header: {
    primary: 'Harbor Street Bakery LLC',
    secondary: 'Commercial term loan · $450,000',
    tertiary: 'Run 4821 · started 9:02 AM',
  },
  actor: { initials: 'DW', name: 'Dana Whitfield', role: 'Credit analyst' },
  stages: STAGES,
  steps: STEPS,
  stepById: STEP_BY_ID,
  edges: EDGE_SEEDS,
  stageLayout: STAGE_LAYOUT,
  lanes: STAGE_LANES,
  laneTop: LANE_TOP,
  laneBottom: LANE_BOTTOM,
  focusStepId: 'approve',
  epoch: 0,
}

/** What the gate offers. Declining is a real option even here. */
const DECISIONS: Decision[] = ['approved', 'changes', 'declined']

/** The run's history, as it would have been logged on the way to the gate. */
const SEED_LOG: [number, LogEntry['level'], string, string, string][] = [
  [0, 'info', 'trigger', 'Loan portal', 'Application received · 6 documents'],
  [4_000, 'info', 'intake', 'Intake agent', 'Classified application, reading documents'],
  [48_000, 'info', 'intake', 'Intake agent', 'Extracted 14 fields from 6 documents'],
  [48_500, 'info', 'bureau', 'credit_bureau.pull', 'Business score 742, no derogatories'],
  [49_000, 'info', 'kyc', 'kyc.verify', '2 of 2 beneficial owners verified'],
  [120_000, 'info', 'spread', 'Spread financials', 'DSCR 1.38× over 3 years'],
  [120_500, 'warn', 'spread', 'Spread financials', 'Revenue down 18% year over year'],
  [158_000, 'info', 'risk', 'Risk scoring', 'Grade 4 of 10 under CRM v3.2'],
  [207_000, 'info', 'memo', 'Draft credit memo', 'Recommends approve with conditions'],
  [207_500, 'warn', 'policy', 'Policy check', '1 exception: guarantor score 672 under 680'],
  [208_000, 'info', 'policy', 'Policy check', 'Senior officer not required under $500,000'],
  [208_500, 'human', 'approve', 'Dana W.', 'Waiting on approval · due in 3h 40m'],
]

const START = Date.now()

function seedLog(): LogEntry[] {
  return SEED_LOG.map(([elapsedMs, level, stepId, source, text], i) => ({
    id: `run-4821-${i}`,
    at: START + elapsedMs,
    elapsedMs,
    level,
    stepId,
    source,
    text,
  }))
}

/**
 * A run with no server behind it. Decisions are applied in-process by the same
 * `applyDecision` this demo has always used, and reported back as events so the
 * page cannot tell the difference.
 */
export function createStaticRunSource(): RunSource {
  const listeners = new Set<(event: RunEvent) => void>()
  let statuses = INITIAL_STATUS
  let logSeq = SEED_LOG.length

  const emit = (event: RunEvent) => listeners.forEach((l) => l(event))

  const log = (level: LogEntry['level'], stepId: string, source: string, text: string) => {
    const elapsedMs = Date.now() - START
    emit({
      type: 'log',
      entries: [
        { id: `run-4821-${logSeq++}`, at: Date.now(), elapsedMs, level, stepId, source, text },
      ],
    })
  }

  const snapshot = (): RunEvent => ({
    type: 'snapshot',
    graph: GRAPH,
    statuses,
    phase: statuses.approve === 'waiting' ? 'awaiting' : 'running',
    log: seedLog(),
    awaiting:
      statuses.approve === 'waiting'
        ? [{ stepId: 'approve', decisions: DECISIONS, dueLabel: '3h 40m' }]
        : [],
  })

  return {
    variants: [],

    subscribe(listener) {
      listeners.add(listener)
      // The snapshot already states the open gate, so there is nothing to add.
      listener(snapshot())
      listener({ type: 'connection', state: 'open' })
      return () => listeners.delete(listener)
    },

    // There is only one run here, so starting is restarting.
    start() {
      this.control('restart')
    },

    decide(stepId, decision, note) {
      if (stepId !== 'approve' || statuses.approve !== 'waiting') return

      const verdict =
        decision === 'approved'
          ? 'Approved'
          : decision === 'changes'
            ? 'Sent back for changes'
            : 'Declined'
      log('human', 'approve', 'Dana W.', note ? `${verdict} — “${note}”` : verdict)

      if (decision === 'declined') {
        // Nothing downstream of a decline runs.
        statuses = { ...statuses, approve: 'failed', letter: 'skipped', notify: 'skipped' }
        emit({ type: 'step', stepId: 'approve', change: { status: 'failed' } })
        emit({ type: 'step', stepId: 'letter', change: { status: 'skipped' } })
        emit({ type: 'step', stepId: 'notify', change: { status: 'skipped' } })
        emit({ type: 'phase', phase: 'finished' })
        log('warn', 'letter', 'Workflow', 'Decision letter and notification skipped')
        return
      }

      const before = statuses
      statuses = applyDecision(statuses, decision)
      for (const id of Object.keys(statuses)) {
        if (statuses[id] !== before[id]) {
          emit({ type: 'step', stepId: id, change: { status: statuses[id] } })
        }
      }

      if (decision === 'changes') {
        log('info', 'memo', 'Draft credit memo', 'Revising the memo with your notes')
        emit({ type: 'phase', phase: 'running' })
      } else {
        log('info', 'letter', 'Draft decision letter', 'Preparing the approval letter')
        emit({ type: 'phase', phase: 'running' })
      }
    },

    control(action) {
      if (action !== 'restart') return
      statuses = INITIAL_STATUS
      logSeq = SEED_LOG.length
      emit(snapshot())
    },
  }
}

/** One instance for the whole app — stable across renders, as useRun requires. */
export const staticRunSource = createStaticRunSource()
