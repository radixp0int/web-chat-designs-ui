// The live route's entry, lazy for the same reason WorkflowRoute is: React Flow
// and the run fixtures belong in a chunk of their own, and the skeleton that
// stands in for them does not.
import { lazy, Suspense } from 'react'
import { WorkflowSkeleton } from './WorkflowSkeleton'

const LiveWorkflow = lazy(() => import('./LiveWorkflow').then((m) => ({ default: m.LiveWorkflow })))

export function WorkflowLiveRoute() {
  return (
    <Suspense fallback={<WorkflowSkeleton />}>
      <LiveWorkflow />
    </Suspense>
  )
}
