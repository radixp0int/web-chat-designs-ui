import { useCallback, useEffect, useRef, useState } from 'react'

type UseStickToBottomOptions = {
  /** How close to the bottom (in px) still counts as "at the bottom". */
  threshold?: number
}

/**
 * Keeps a scrollable region pinned to its bottom edge while its content
 * grows — new turns, streamed tokens, anything that changes `contentRef`'s
 * height — but only while the reader hasn't scrolled away from the bottom
 * themselves. Growth is observed via ResizeObserver on `contentRef`, so the
 * hook never needs to know *what* is growing it (chat messages, log lines,
 * anything) — that's what keeps it portable across apps and layouts.
 *
 * Pure React: no app types, no styling. Pair it with a "scroll to bottom"
 * affordance driven by `atBottom` (see the `ScrollToBottomButton` component
 * for one, kept separate for the same portability reason).
 *
 * Usage:
 *   const { containerRef, contentRef, atBottom, scrollToBottom } = useStickToBottom()
 *   <div ref={containerRef} className="overflow-y-auto">
 *     <div ref={contentRef}>{...growing content...}</div>
 *   </div>
 */
export function useStickToBottom({ threshold = 120 }: UseStickToBottomOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(true)
  // Mirrors `atBottom` for the ResizeObserver callback below, which must read
  // the latest value without depending on (and re-subscribing over) it.
  const atBottomRef = useRef(true)

  const isNearBottom = useCallback(() => {
    const el = containerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
  }, [threshold])

  /** Jump (or animate) back to the bottom and resume sticking to it. */
  const scrollToBottom = useCallback((opts?: { smooth?: boolean }) => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: opts?.smooth ? 'smooth' : 'auto' })
    atBottomRef.current = true
    setAtBottom(true)
  }, [])

  // Track the reader's own scrolling — this is what lets a manual scroll up
  // opt out of the auto-follow below, and back in by returning to the bottom.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => {
      const near = isNearBottom()
      atBottomRef.current = near
      setAtBottom(near)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [isNearBottom])

  // Follow content growth, but only while still at the bottom. Observing
  // `contentRef` (not the scroll container itself) is what catches streamed
  // text growing the page without a `deps` array tied to any particular
  // piece of app state.
  useEffect(() => {
    const content = contentRef.current
    const el = containerRef.current
    if (!content || !el) return
    const ro = new ResizeObserver(() => {
      if (atBottomRef.current) el.scrollTo({ top: el.scrollHeight })
    })
    ro.observe(content)
    return () => ro.disconnect()
  }, [])

  return { containerRef, contentRef, atBottom, scrollToBottom }
}
