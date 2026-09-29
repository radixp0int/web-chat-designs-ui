import type { KeyboardEvent, RefObject } from 'react'
import { ChevronDownIcon, ChevronUpIcon, XIcon } from '../components/icons'
import { IconButton } from '../components/icon-button'
import { Button } from './button'

export function FindReplaceBar({
  query,
  replacement,
  replaceOpen,
  replaceAvailable,
  current,
  total,
  canReplaceCurrent,
  canReplaceAll,
  inputRef,
  replacementInputRef,
  onQueryChange,
  onReplacementChange,
  onToggleReplace,
  onPrevious,
  onNext,
  onReplace,
  onReplaceAll,
  onClose,
}: {
  query: string
  replacement: string
  replaceOpen: boolean
  replaceAvailable: boolean
  current: number
  total: number
  canReplaceCurrent: boolean
  canReplaceAll: boolean
  inputRef: RefObject<HTMLInputElement | null>
  replacementInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (value: string) => void
  onReplacementChange: (value: string) => void
  onToggleReplace: () => void
  onPrevious: () => void
  onNext: () => void
  onReplace: () => void
  onReplaceAll: () => void
  onClose: () => void
}) {
  const navigate = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    if (event.shiftKey) onPrevious()
    else onNext()
  }

  return (
    <div className="relative z-20 flex shrink-0 flex-col gap-1 border-b border-line bg-code-block px-2 py-1.5">
      <div className="flex min-w-0 items-center gap-1.5">
        {replaceAvailable && (
          <Button
            size="sm"
            variant="ghost"
            aria-expanded={replaceOpen}
            onClick={onToggleReplace}
            className="px-2"
          >
            Replace
          </Button>
        )}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={navigate}
          aria-label="Find"
          placeholder="Find"
          className="h-8 min-w-28 grow rounded-control border border-line bg-panel-solid px-2.5 text-[12.5px] text-ink outline-none placeholder:text-ink-soft focus:border-accent focus:ring-3 focus:ring-accent/20"
        />
        <span
          aria-live="polite"
          className="min-w-14 text-center text-[12px] text-ink-soft tabular-nums"
        >
          {query ? (total ? `${current + 1} of ${total}` : 'No results') : '0 results'}
        </span>
        <IconButton
          size="sm"
          shape="rounded"
          aria-label="Previous match"
          disabled={!total}
          onClick={onPrevious}
        >
          <ChevronUpIcon width={15} height={15} />
        </IconButton>
        <IconButton
          size="sm"
          shape="rounded"
          aria-label="Next match"
          disabled={!total}
          onClick={onNext}
        >
          <ChevronDownIcon width={15} height={15} />
        </IconButton>
        <IconButton size="sm" shape="rounded" aria-label="Close find" onClick={onClose}>
          <XIcon width={13} height={13} />
        </IconButton>
      </div>
      {replaceOpen && replaceAvailable && (
        <div className="flex min-w-0 items-center gap-1.5 pl-[77px]">
          <input
            ref={replacementInputRef}
            value={replacement}
            onChange={(event) => onReplacementChange(event.target.value)}
            aria-label="Replace with"
            placeholder="Replace with"
            className="h-8 min-w-28 grow rounded-control border border-line bg-panel-solid px-2.5 text-[12.5px] text-ink outline-none placeholder:text-ink-soft focus:border-accent focus:ring-3 focus:ring-accent/20"
          />
          <Button size="sm" variant="ghost" disabled={!canReplaceCurrent} onClick={onReplace}>
            Replace
          </Button>
          <Button size="sm" variant="ghost" disabled={!canReplaceAll} onClick={onReplaceAll}>
            All
          </Button>
        </div>
      )}
    </div>
  )
}
