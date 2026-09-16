// The route entry: everything React Flow rides in a lazy chunk, and the skeleton
// that stands in for it does not. Kept in its own file so main.tsx imports a
// plain component (a lazy() const declared there trips the fast-refresh lint).
import { lazy, Suspense } from 'react'
import { WorkflowSkeleton } from './WorkflowSkeleton'

const WorkflowDemoPage = lazy(() =>
  import('./WorkflowDemoPage').then((m) => ({ default: m.WorkflowDemoPage })),
)

export function WorkflowRoute() {
  return (
    <Suspense fallback={<WorkflowSkeleton />}>
      <WorkflowDemoPage />
    </Suspense>
  )
}
