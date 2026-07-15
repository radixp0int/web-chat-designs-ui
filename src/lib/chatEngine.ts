// The conversation "engine": the message shape plus a pluggable responder.
//
// A Responder turns a prompt into a stream of ChatEvents. The UI and the
// useChat hook only know about this interface, so swapping the canned demo
// responder for one backed by a real streaming API (e.g. server-sent events
// from a Claude endpoint) needs no changes anywhere else.

export type Message = {
  id: number
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  thinkingActive?: boolean
  thinkingSec?: number
  streaming?: boolean
}

export type ChatEvent =
  | { type: 'thinking'; delta: string }
  | { type: 'thinking-done' }
  | { type: 'content'; delta: string }

export type Responder = (prompt: string, signal: AbortSignal) => AsyncGenerator<ChatEvent>

export type CannedTurn = {
  thinking: string
  content: string
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

/**
 * Builds a Responder that replays canned turns word by word, cycling through
 * them. Stands in for a real model while keeping the same streaming contract.
 */
export function createCannedResponder(turns: CannedTurn[]): Responder {
  let index = 0
  return async function* respond(_prompt, signal) {
    const turn = turns[index++ % turns.length]

    await sleep(PACING.beforeFirstToken, signal)
    for (const word of turn.thinking.split(' ')) {
      yield { type: 'thinking', delta: word }
      await sleep(PACING.perThinkingWord, signal)
    }

    await sleep(PACING.thinkingToContent, signal)
    yield { type: 'thinking-done' }

    for (const word of turn.content.split(' ')) {
      yield { type: 'content', delta: word }
      await sleep(PACING.perContentWord, signal)
    }
  }
}
