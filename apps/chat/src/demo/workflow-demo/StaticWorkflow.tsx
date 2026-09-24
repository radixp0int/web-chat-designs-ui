// The hard-coded run, on the page. Lazily imported by WorkflowRoute so the loan
// fixture rides in the same chunk as React Flow rather than the main bundle.
import { staticRunSource } from './run'
import { WorkflowDemoPage } from './WorkflowDemoPage'

export function StaticWorkflow() {
  return <WorkflowDemoPage source={staticRunSource} />
}
