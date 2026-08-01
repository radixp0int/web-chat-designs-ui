export type RendererProps = {
  /** Raw mermaid source. May be mid-stream and syntactically incomplete. */
  code: string
  /**
   * Hold the last successful SVG on screen instead of swapping to an error box.
   * The mitigation that matters while a message is still streaming.
   */
  keepLastGood?: boolean
  /**
   * Suppress render attempts entirely — the caller knows the source is still
   * arriving. Compares "flicker" against "nothing until done".
   */
  paused?: boolean
  /** Reports the last measured render duration in milliseconds. */
  onTiming?: (ms: number) => void
}

export type RendererMeta = {
  key: 'official' | 'beautiful'
  name: string
  pkg: string
  version: string
  mode: 'async' | 'sync'
  note: string
}

export const RENDERER_META: RendererMeta[] = [
  {
    key: 'official',
    name: 'Official Mermaid',
    pkg: 'mermaid',
    version: '11.16.0',
    mode: 'async',
    note: 'Reference implementation. Every diagram type, 21 dependencies.',
  },
  {
    key: 'beautiful',
    name: 'beautiful-mermaid',
    pkg: 'beautiful-mermaid',
    version: '1.1.3',
    mode: 'sync',
    note: 'Zero-DOM, synchronous SVG string. Colors stay as CSS custom properties.',
  },
]
