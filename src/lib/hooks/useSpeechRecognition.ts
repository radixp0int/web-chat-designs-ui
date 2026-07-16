import { useCallback, useEffect, useRef, useState } from 'react'

// Minimal typing for the (prefixed) Web Speech API.
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start(): void
  stop(): void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    (new () => SpeechRecognitionLike) | null
}

type Options = {
  /** Called with the joined transcript each time the recognizer emits a result. */
  onResult: (text: string) => void
  /** Fired right after listening starts (e.g. to refocus the input). */
  onStart?: () => void
}

/**
 * Wraps the browser Speech Recognition API as a toggle. `supported` is false
 * where the API is unavailable, so callers can hide the control entirely. The
 * in-flight recognizer is stopped on unmount.
 */
export function useSpeechRecognition({ onResult, onStart }: Options) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const supported = useRef(getSpeechRecognition() !== null).current

  // Hold the latest callbacks so the recognizer's handlers never go stale.
  const onResultRef = useRef(onResult)
  const onStartRef = useRef(onStart)
  onResultRef.current = onResult
  onStartRef.current = onStart

  useEffect(() => () => recognitionRef.current?.stop(), [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (listening) {
      stop()
      return
    }
    const Recognition = getSpeechRecognition()
    if (!Recognition) return
    const recognition = new Recognition()
    recognition.lang = navigator.language || 'en-US'
    recognition.interimResults = false
    recognition.continuous = true
    recognition.onresult = (event) => {
      const chunk = Array.from(
        { length: event.results.length },
        (_, i) => event.results[i][0].transcript,
      )
        .join(' ')
        .trim()
      if (chunk) onResultRef.current(chunk)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
    onStartRef.current?.()
  }, [listening, stop])

  return { supported, listening, toggle, stop }
}
