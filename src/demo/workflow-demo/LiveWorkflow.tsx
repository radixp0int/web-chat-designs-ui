// The server-driven run, on the page.
//
// Falls back to the hard-coded run when VITE_WORKFLOW_WS_URL is unset, so this
// route is never a blank screen — the same shape demo/App.tsx uses to choose
// between a WebSocket responder and the canned one.
import { staticRunSource, wsRunSource } from './run'
import { WorkflowDemoPage } from './WorkflowDemoPage'

const url = import.meta.env.VITE_WORKFLOW_WS_URL as string | undefined
const source = url ? wsRunSource(url) : staticRunSource

export function LiveWorkflow() {
  return (
    <>
      {!url && (
        <div
          role="status"
          className="absolute inset-x-0 top-0 z-50 bg-notify/12 px-4 py-2 text-center text-[13px] text-ink-strong"
        >
          No workflow server configured — showing the hard-coded run. Set{' '}
          <code className="font-mono">VITE_WORKFLOW_WS_URL</code> and restart the dev server.
        </div>
      )}
      <WorkflowDemoPage source={source} />
    </>
  )
}
