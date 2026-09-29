import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { View } from '../canvas'
import type { LogEntry, RunPhase } from '../run'
import { RunLog } from './RunLog'
import { RunTopBar } from './RunTopBar'

const LOG: LogEntry[] = [
  [0, 'info', 'trigger', 'Loan portal', 'Application received · 6 documents'],
  [4_000, 'info', 'intake', 'Intake agent', 'Classified application, reading documents'],
  [48_500, 'info', 'bureau', 'credit_bureau.pull', 'Business score 742, no derogatories'],
  [120_500, 'warn', 'spread', 'Spread financials', 'Revenue down 18% year over year'],
  [207_500, 'warn', 'policy', 'Policy check', '1 exception: guarantor score 672 under 680'],
  [212_000, 'error', 'kyc', 'kyc.verify', 'Beneficial owner #3 did not match the registry'],
  [260_000, 'human', 'approve', 'Dana W.', 'Requested changes: re-run KYC on owner #3'],
].map(([elapsedMs, level, stepId, source, text], i) => ({
  id: `run-4821-${i}`,
  at: Date.parse('2026-09-28T13:02:00Z') + (elapsedMs as number),
  elapsedMs: elapsedMs as number,
  level: level as LogEntry['level'],
  stepId: stepId as string,
  source: source as string,
  text: text as string,
}))

const STEP_TITLES = new Map([
  ['trigger', 'Application received'],
  ['intake', 'Intake'],
  ['bureau', 'Credit bureau pull'],
  ['spread', 'Spread financials'],
  ['policy', 'Policy check'],
  ['kyc', 'KYC verification'],
  ['approve', 'Credit approval'],
])

/** The run's top bar with every control live except the ones it hands back up. */
function TopBar({ phase, waitingCount = 1 }: { phase: RunPhase; waitingCount?: number }) {
  const [view, setView] = useState<View>('normal')
  const [details, setDetails] = useState(true)
  const [log, setLog] = useState(false)
  return (
    <div className="@container rounded-surface border border-line bg-panel-solid">
      <RunTopBar
        title="Commercial loan review"
        view={view}
        onView={setView}
        waitingCount={waitingCount}
        phase={phase}
        onControl={fn()}
        runPanelOpen
        onShowRunPanel={fn()}
        detailsOpen={details}
        onToggleDetails={() => setDetails((d) => !d)}
        logOpen={log}
        onToggleLog={() => setLog((l) => !l)}
      />
    </div>
  )
}

const meta = {
  title: 'Recipes/Workflows/Panels',
  parameters: {
    docs: {
      description: {
        component:
          'The workflow page’s panels on their own. The top bar is sized by a `@container`, not the viewport: as its column narrows it sheds the breadcrumb, the pill’s words, the pill, then the run controls — the details toggle is never dropped.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const TopBarRunning: Story = { render: () => <TopBar phase="running" waitingCount={0} /> }

export const TopBarAwaiting: Story = { render: () => <TopBar phase="awaiting" waitingCount={2} /> }

export const TopBarPaused: Story = { render: () => <TopBar phase="paused" /> }

export const TopBarFinished: Story = { render: () => <TopBar phase="finished" waitingCount={0} /> }

/** Narrow the column to watch the bar shed content in order. */
export const TopBarNarrow: Story = {
  render: () => (
    <div className="max-w-md">
      <TopBar phase="awaiting" waitingCount={2} />
    </div>
  ),
}

/** Every level: info, warn, error, and a person's line standing out by weight. */
export const Log: Story = {
  render: () => (
    <div className="flex flex-col overflow-hidden rounded-surface border border-line bg-panel-solid">
      <RunLog
        entries={LOG}
        trimmed={0}
        open
        stepTitles={STEP_TITLES}
        onSelectStep={fn()}
        onClose={fn()}
      />
    </div>
  ),
}

/** The cap has dropped older lines, and the log admits to it. */
export const LogTrimmed: Story = {
  render: () => (
    <div className="flex flex-col overflow-hidden rounded-surface border border-line bg-panel-solid">
      <RunLog
        entries={LOG}
        trimmed={137}
        open
        stepTitles={STEP_TITLES}
        onSelectStep={fn()}
        onClose={fn()}
      />
    </div>
  ),
}
