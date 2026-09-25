import { useCallback, useEffect, useRef, useState } from 'react'

type UseVirtualRowsOptions = {
  /** Total rows in the list, not the number you intend to render. */
  count: number
  /** Fixed — the window must never need a measuring pass. */
  rowHeight: number
  /** Scroller height in px. */
  height: number
  overscan?: number
  /** Changing this scrolls back to the top (a new query, a cleared filter). */
  resetKey?: unknown
  /** Fired as the window nears the end of what is loaded. */
  onNearEnd?: () => void
}

/**
 * The smallest windowing hook that is actually correct for this job.
 *
 * Two things it does that a naive version does not. It reads `scrollTop`
 * synchronously and applies it inside one `requestAnimationFrame`, so a
 * trackpad fling does not queue a render per wheel event. And it re-renders
 * only when the first visible row changes, not on every pixel — which is the
 * difference between a smooth 20,000-row list and a janky one.
 *
 * Rows must be keyed by value, not index: keying by index re-mounts the whole
 * window whenever counts refresh, and the scroll position goes with it.
 */
export function useVirtualRows({
  count,
  rowHeight,
  height,
  overscan = 4,
  resetKey,
  onNearEnd,
}: UseVirtualRowsOptions) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const frame = useRef(0)
  const [start, setStart] = useState(0)

  const perView = Math.ceil(height / rowHeight)
  const end = Math.min(count, start + perView + overscan * 2)

  // A new result set is a new list: keeping the old offset would land the
  // viewer somewhere arbitrary in it.
  useEffect(() => {
    setStart(0)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [resetKey])

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    },
    [],
  )

  const onScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const top = event.currentTarget.scrollTop
      if (frame.current) return
      frame.current = requestAnimationFrame(() => {
        frame.current = 0
        const next = Math.max(0, Math.floor(top / rowHeight) - overscan)
        setStart((current) => (current === next ? current : next))
        if (onNearEnd && next + perView + overscan * 2 >= count - overscan) onNearEnd()
      })
    },
    [count, overscan, perView, rowHeight, onNearEnd],
  )

  return {
    scrollRef,
    onScroll,
    start,
    end,
    padTop: start * rowHeight,
    padBottom: Math.max(0, (count - end) * rowHeight),
  }
}
