import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Source } from '../engine/chatEngine'
import { CitationChip } from './CitationChip'
import { useUiSize } from '../uiSize'

type MarkdownProps = {
  text: string
  streaming?: boolean
  /** When present, inline [n] markers matching a source id become chips. */
  sources?: Source[]
  onCite?: (sourceId: number) => void
}

/**
 * Rewrites [n] markers into markdown links ([n](#cite-n)) that the `a`
 * component below turns into CitationChips. Only numbers matching a real
 * source id are rewritten, so bracketed prose like [sic] passes through.
 * While streaming, a half-received trailing marker ("[" / "[12") is hidden
 * so it never flickers as plain text.
 *
 * Limitation: markers inside code spans/blocks would also be rewritten;
 * the canned demo data keeps [n] out of code.
 */
function linkifyCitations(text: string, sources: Source[] | undefined, streaming: boolean): string {
  let out = text
  if (sources?.length) {
    const ids = new Set(sources.map((s) => s.id))
    out = out.replace(/\[(\d+)\]/g, (match, n) =>
      ids.has(Number(n)) ? `[${n}](#cite-${n})` : match,
    )
  }
  if (streaming) out = out.replace(/\[\d*$/, '')
  return out
}

const CITE_PREFIX = '#cite-'

/** Shared markdown renderer for assistant messages and reference documents. */
export function Markdown({ text, streaming, sources, onCite }: MarkdownProps) {
  const compact = useUiSize() === 'compact'

  const components: Components = {
    a: ({ href, children }) => {
      if (href?.startsWith(CITE_PREFIX)) {
        const id = Number(href.slice(CITE_PREFIX.length))
        return <CitationChip n={id} onClick={() => onCite?.(id)} />
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-brand-500 underline decoration-brand-500/40 underline-offset-2 transition hover:decoration-brand-500 dark:text-brand-300 dark:decoration-brand-300/40 dark:hover:decoration-brand-300"
        >
          {children}
        </a>
      )
    },
    p: ({ children }) => <p className="my-2.5 first:mt-0 last:mb-0">{children}</p>,
    h1: ({ children }) => (
      <h1 className="mt-5 mb-2 text-lg font-semibold text-(--text-strong) first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-5 mb-2 text-base font-semibold text-(--text-strong) first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-4 mb-1.5 font-semibold text-(--text-strong) first:mt-0">{children}</h3>
    ),
    ul: ({ children }) => <ul className="my-2.5 list-disc space-y-1 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="my-2.5 list-decimal space-y-1 pl-5">{children}</ol>,
    li: ({ children }) => <li className="[&>p]:my-0">{children}</li>,
    strong: ({ children }) => (
      <strong className="font-semibold text-(--text-strong)">{children}</strong>
    ),
    code: ({ children }) => (
      <code className="rounded bg-brand-600/8 px-1.5 py-0.5 font-mono text-[0.85em] text-(--text-strong) dark:bg-white/10">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre
        className={`my-3 overflow-x-auto rounded-xl border border-(--panel-border) bg-brand-950/4 p-3.5 font-mono leading-relaxed dark:bg-white/5 [&>code]:bg-transparent [&>code]:p-0 ${compact ? 'text-xs' : 'text-[13px]'}`}
      >
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="my-3 overflow-x-auto rounded-xl border border-(--panel-border)">
        <table className={`w-full border-collapse ${compact ? 'text-[13px]' : 'text-sm'}`}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, style }) => (
      <th
        style={style}
        className="border-b border-(--panel-border) bg-brand-600/4 px-3 py-1.5 text-left font-semibold whitespace-nowrap text-(--text-strong) dark:bg-white/4"
      >
        {children}
      </th>
    ),
    td: ({ children, style }) => (
      <td
        style={style}
        className="border-b border-(--panel-border)/60 px-3 py-1.5 align-top last:border-b-0"
      >
        {children}
      </td>
    ),
    tr: ({ children }) => <tr className="last:[&>td]:border-b-0">{children}</tr>,
    blockquote: ({ children }) => (
      <blockquote className="my-3 border-l-2 border-accent-500/40 pl-4 text-(--text-soft) italic">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-4 border-(--panel-border)" />,
  }

  return (
    <>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {linkifyCitations(text, sources, !!streaming)}
      </ReactMarkdown>
      {streaming && <span className="text-accent-500">▍</span>}
    </>
  )
}
