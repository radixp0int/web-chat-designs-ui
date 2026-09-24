import { useCallback, useEffect, useRef, useState } from 'react'

const TICK_MS = 60

/**
 * Replays a diagram source in chunks, the way a model streams one.
 *
 * The point is that every intermediate value is syntactically broken. The
 * existing markdown renderer already renders partial text while `streaming`
 * is true (markdown.tsx), so whatever we pick has to survive being handed
 * garbage ~40 times before it ever sees a valid diagram.
 */
export function useStreamReplay(source: string, chunkSize: number) {
  const [cursor, setCursor] = useState(source.length)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (timer.current !== null) {
      clearInterval(timer.current)
      timer.current = null
    }
  }, [])

  // A new source resets the replay to "fully arrived" rather than leaving a
  // stale cursor pointing into the middle of different text.
  useEffect(() => {
    stop()
    setPlaying(false)
    setCursor(source.length)
  }, [source, stop])

  useEffect(() => {
    if (!playing) {
      stop()
      return
    }
    timer.current = window.setInterval(() => {
      setCursor((c) => {
        const next = c + chunkSize
        if (next >= source.length) {
          setPlaying(false)
          return source.length
        }
        return next
      })
    }, TICK_MS)
    return stop
  }, [playing, chunkSize, source.length, stop])

  const play = useCallback(() => {
    setCursor(0)
    setPlaying(true)
  }, [])

  const complete = cursor >= source.length

  return {
    text: source.slice(0, cursor),
    cursor,
    setCursor,
    playing,
    play,
    pause: () => setPlaying(false),
    complete,
    total: source.length,
  }
}
