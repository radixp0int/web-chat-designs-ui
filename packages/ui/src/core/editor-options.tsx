import { useEffect, useRef, useState } from 'react'
import { DotsIcon } from '../components/icons'
import { IconButton } from '../components/icon-button'
import { Switch } from './switch'

export type EditorOptions = {
  /** Monaco-compatible value: wrap long lines at the editor viewport. */
  wordWrap?: 'off' | 'on'
  /** Monaco-compatible value: show or hide the line-number gutter. */
  lineNumbers?: 'off' | 'on'
  /** Show or hide the editor's secondary status row. */
  statusBar?: boolean | 'off' | 'on'
}

type Option = {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

/** A compact, locally positioned options menu shared by both code surfaces. */
export function EditorOptionsMenu({
  options,
  disabled,
}: {
  options: Option[]
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={root} className="relative shrink-0">
      <IconButton
        size="sm"
        shape="rounded"
        aria-label="Editor options"
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        <DotsIcon width={16} height={16} />
      </IconButton>
      {open && (
        <div
          role="dialog"
          aria-label="Editor options"
          className="absolute top-full right-0 left-auto z-30 mt-1 w-52 rounded-control border border-line bg-panel-solid p-2 shadow-xl shadow-(color:--shadow-menu)"
        >
          <div className="flex flex-col gap-1">
            {options.map((option) => (
              <Switch
                key={option.label}
                label={option.label}
                checked={option.checked}
                disabled={disabled || option.disabled}
                onChange={option.onChange}
                className="justify-between rounded-control px-2 py-1.5 [&>button]:order-2"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
