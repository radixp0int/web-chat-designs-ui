import type { Sort } from '../paging'

/**
 * What one click on a sortable header does.
 *
 * Two states, not three. A tri-state cycle (asc → desc → unsorted) reads well
 * in a spec and badly in use: the third click appears to do nothing, because
 * "unsorted" from a server usually means whatever order the query happened to
 * return, which is often the order it was already in. Clearing a sort is the
 * job of a Reset control, where it can say so.
 */
export function toggleSort(sortKey: string, current: Sort[] = []): Sort[] {
  const active = current[0]
  if (active?.field === sortKey) {
    return [{ field: sortKey, direction: active.direction === 'asc' ? 'desc' : 'asc' }]
  }
  return [{ field: sortKey, direction: 'asc' }]
}

/** The direction this column is sorted in, or null when it is not the sort. */
export function directionFor(sortKey: string | undefined, current: Sort[] = []) {
  if (!sortKey) return null
  const active = current[0]
  return active?.field === sortKey ? active.direction : null
}
