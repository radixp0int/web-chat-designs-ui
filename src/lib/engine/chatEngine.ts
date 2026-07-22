// The conversation "engine": the message shape plus a pluggable responder.
//
// A Responder turns a prompt into a stream of ChatEvents. The UI and the
// useChat hook only know about this interface, so swapping the canned demo
// responder for one backed by a real streaming API (e.g. the mock WebSocket
// server in ../chat-ws-server) needs no changes anywhere else.

// Shared domain shapes live in ../types; this module owns the streaming
// contract (events, responder) that consumes them.
import type { Highlight, Source, ToolCall } from '../types'

// Deltas carry their own whitespace — consumers concatenate them verbatim.
// The optional fullText on thinking-done/done lets a server replace the
// accumulated text with its authoritative joined copy.
export type ChatEvent =
  | { type: 'thinking'; delta: string }
  | { type: 'thinking-done'; fullText?: string }
  | { type: 'content'; delta: string }
  | { type: 'done'; fullText?: string }
  | { type: 'tool'; toolCall: ToolCall }
  | { type: 'sources'; sources: Source[]; highlights?: Highlight[] }
  | { type: 'error'; message: string; recoverable: boolean }

export type Responder = (prompt: string, signal: AbortSignal) => AsyncGenerator<ChatEvent>

export type CannedTurn = {
  thinking: string
  content: string
  sources?: Source[]
  /** Passages to highlight in this turn's cited source docs (by referenceNumber). */
  highlights?: Highlight[]
  /** When set, a prompt matching this pattern plays this turn instead of the
   *  next one in the cycle — handy for demo turns you want on demand. */
  match?: RegExp
}

// Pacing for the simulated stream, in milliseconds. Tune the whole feel here.
const PACING = {
  beforeFirstToken: 450,
  perThinkingWord: 28,
  thinkingToContent: 500,
  perContentWord: 32,
}

/** A cancellable delay that rejects with an AbortError when the signal fires. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

/** Splits text into words that keep their trailing whitespace, so joining the
 *  pieces with '' reproduces the original exactly (newlines included). */
const wordsWithSpace = (text: string) => text.split(/(?<=\s)/)

/**
 * Builds a Responder that replays canned turns word by word, cycling through
 * them. Stands in for a real model while keeping the same streaming contract.
 */
export function createCannedResponder(turns: CannedTurn[]): Responder {
  let index = 0
  const cycle = turns.filter((t) => !t.match)
  return async function* respond(prompt, signal) {
    const turn = turns.find((t) => t.match?.test(prompt)) ?? cycle[index++ % cycle.length]

    await sleep(PACING.beforeFirstToken, signal)
    for (const word of wordsWithSpace(turn.thinking)) {
      yield { type: 'thinking', delta: word }
      await sleep(PACING.perThinkingWord, signal)
    }

    await sleep(PACING.thinkingToContent, signal)
    yield { type: 'thinking-done' }

    // Sources land before the content streams so [n] citation markers are
    // resolvable (and clickable) the moment they appear. Their highlights ride
    // along so opening a reference can light up its supporting passages.
    if (turn.sources?.length)
      yield { type: 'sources', sources: turn.sources, highlights: turn.highlights }

    for (const word of wordsWithSpace(turn.content)) {
      yield { type: 'content', delta: word }
      await sleep(PACING.perContentWord, signal)
    }
    yield { type: 'done' }
  }
}
