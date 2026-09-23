import type { ReactNode } from 'react'

/**
 * Loading keeps the frame and the column widths — only the cell contents go
 * grey. Swapping the whole table for a spinner throws away the one thing the
 * reader already knows (where the columns are) and makes every load feel like
 * a navigation.
 *
 * The bars fade down the list rather than shimmering. A shimmer on a dozen
 * rows at once is a lot of motion for something that usually lasts 200ms, and
 * it is the first thing to look broken under `prefers-reduced-motion`.
 */
export function SkeletonRows({ rows, columns }: { rows: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="border-b border-line/70 last:border-b-0">
          {Array.from({ length: columns }, (_, c) => (
            <td key={c} className="h-13 px-4">
              <span
                className="block h-2.5 rounded-full bg-ink-soft"
                style={{
                  width: `${[74, 58, 66, 44, 60][(r + c) % 5]}%`,
                  opacity: Math.max(0.05, 0.16 - r * 0.02),
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/**
 * Empty says what was searched and offers the way back out.
 *
 * "No results" on its own is a dead end — the reader has to reconstruct which
 * of their filters did it. Naming the query and the filter count is what turns
 * it into something actionable, and the two buttons are the two things anyone
 * actually wants next.
 */
export function EmptyState({
  colSpan,
  title,
  body,
}: {
  colSpan: number
  title: string
  body?: ReactNode
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-14">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-[15.5px] font-extrabold text-ink-strong">{title}</span>
          {body}
        </div>
      </td>
    </tr>
  )
}
