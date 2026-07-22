import { useRef, useState } from 'react'
import { useBranding } from '../branding'
import { useAutoGrowTextarea } from '../hooks/useAutoGrowTextarea'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import type { Persona } from '../types'
import {
  CollapseVerticalIcon,
  ExpandVerticalIcon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
  SendIcon,
  StopIcon,
  XIcon,
} from './Icons'
import { IconButton } from './IconButton'
import { PersonaMenu } from './PersonaMenu'
import { useUiSize, type UiSize } from '../uiSize'

// Textarea growth behavior per density. `expandThreshold` is the draft length
// at which the expand button appears; `expandedCap` is the max height while
// expanded. Compact caps are fixed because the widget panel is ~600px tall.
const SIZING: Record<
  UiSize,
  { expandThreshold: number; collapsed: number; expandedCap: () => number }
> = {
  default: {
    expandThreshold: 200,
    collapsed: 180,
    expandedCap: () => window.innerHeight * 0.65,
  },
  compact: {
    expandThreshold: 120,
    collapsed: 100,
    expandedCap: () => 240,
  },
}

type ComposerProps = {
  docked: boolean
  disabled?: boolean
  /** A response is streaming: the send button becomes a stop button, and
   *  submits queue (Enter) or steer (Cmd/Ctrl+Enter) instead of sending. */
  streaming?: boolean
  onStop?: () => void
  onSubmit: (text: string, opts?: { steer?: boolean }) => void
  personas: Persona[]
  persona: string
  onPersonaChange: (id: string) => void
}

export function Composer({
  docked,
  disabled = false,
  streaming = false,
  onStop,
  onSubmit,
  personas,
  persona,
  onPersonaChange,
}: ComposerProps) {
  const { appName } = useBranding()
  const size = useUiSize()
  const compact = size === 'compact'
  const sizing = SIZING[size]

  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)

  const canExpand = value.length >= sizing.expandThreshold
  // Only honor the expanded state while the draft is long enough to warrant it.
  const expandedHeight = expanded && canExpand

  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useAutoGrowTextarea(value, expandedHeight, sizing)

  const speech = useSpeechRecognition({
    onResult: (chunk) => setValue((prev) => (prev ? `${prev} ${chunk}` : chunk)),
    onStart: () => textareaRef.current?.focus(),
  })

  function submit(opts?: { steer?: boolean }) {
    const text = value.trim()
    if (!text || disabled) return
    speech.stop()
    setValue('')
    setAttachments([])
    setExpanded(false)
    onSubmit(text, opts)
  }

  const toolIconSize = compact ? 16 : 18

  return (
    <div
      className={`glass w-full shadow-lg shadow-brand-600/5 transition-shadow duration-300 focus-within:shadow-xl focus-within:shadow-brand-600/10 dark:shadow-black/20 ${
        compact ? 'rounded-2xl' : 'rounded-3xl'
      } ${docked ? '' : 'shadow-xl'}`}
    >
      {attachments.length > 0 && (
        <div className={`flex flex-wrap gap-2 ${compact ? 'px-3 pt-2.5' : 'px-4 pt-3'}`}>
          {attachments.map((name) => (
            <span
              key={name}
              className={`flex items-center gap-1.5 rounded-full bg-brand-600/10 py-1 pr-1.5 pl-3 font-medium text-brand-600 dark:bg-brand-300/15 dark:text-brand-200 ${
                compact ? 'text-[11px]' : 'text-xs'
              }`}
            >
              <PaperclipIcon width={13} height={13} />
              <span className={compact ? 'max-w-28 truncate' : 'max-w-40 truncate'}>{name}</span>
              <button
                type="button"
                onClick={() => setAttachments((a) => a.filter((n) => n !== name))}
                className="rounded-full p-0.5 hover:bg-brand-600/15"
                aria-label={`Remove ${name}`}
              >
                <XIcon width={12} height={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              // Cmd/Ctrl+Enter steers: interrupts the in-flight response and
              // sends immediately. Plain Enter queues while streaming.
              submit({ steer: e.metaKey || e.ctrlKey })
            }
          }}
          rows={compact || docked ? 1 : 2}
          placeholder={speech.listening ? 'Listening…' : 'Ask anything…'}
          aria-label={`Message ${appName}`}
          className={`w-full resize-none bg-transparent pb-1 leading-relaxed text-(--text-strong) outline-none placeholder:text-(--text-soft) ${
            compact ? 'pt-3 pl-4 text-sm' : 'pt-4 pl-5 text-[15px]'
          } ${canExpand ? (compact ? 'pr-10' : 'pr-12') : compact ? 'pr-4' : 'pr-5'}`}
        />

        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-pressed={expanded}
            aria-label={expanded ? 'Collapse input' : 'Expand input'}
            title={expanded ? 'Collapse' : 'Expand'}
            className={`absolute rounded-lg p-1.5 text-(--text-soft) transition hover:bg-brand-600/8 hover:text-(--text-strong) dark:hover:bg-white/8 ${
              compact ? 'top-1.5 right-2' : 'top-2.5 right-3'
            }`}
          >
            {expanded ? (
              <CollapseVerticalIcon width={16} height={16} />
            ) : (
              <ExpandVerticalIcon width={16} height={16} />
            )}
          </button>
        )}
      </div>

      <div className={`flex items-center ${compact ? 'gap-1 px-2 pb-2' : 'gap-1.5 px-3 pb-3'}`}>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const names = Array.from(e.target.files ?? []).map((f) => f.name)
            setAttachments((prev) => [...new Set([...prev, ...names])])
            e.target.value = ''
          }}
        />
        <IconButton
          size={compact ? 'md' : 'lg'}
          onClick={() => fileRef.current?.click()}
          aria-label="Attach files"
          title="Attach files"
        >
          <PlusIcon width={toolIconSize} height={toolIconSize} />
        </IconButton>

        {speech.supported && (
          <button
            type="button"
            onClick={speech.toggle}
            aria-pressed={speech.listening}
            aria-label={speech.listening ? 'Stop voice input' : 'Start voice input'}
            title="Voice to text"
            className={`relative rounded-full transition ${compact ? 'p-1.5' : 'p-2'} ${
              speech.listening
                ? 'bg-accent-500/15 text-accent-600 dark:text-accent-400'
                : 'text-(--text-soft) hover:bg-brand-600/8 hover:text-(--text-strong) dark:hover:bg-white/8'
            }`}
          >
            {speech.listening && (
              <span
                className="absolute inset-0 animate-ping rounded-full bg-accent-500/30"
                aria-hidden
              />
            )}
            <MicIcon width={toolIconSize} height={toolIconSize} />
          </button>
        )}

        <PersonaMenu
          personas={personas}
          persona={persona}
          onChange={onPersonaChange}
          compact={compact}
        />

        {streaming ? (
          <div className={`ml-auto flex items-center ${compact ? 'gap-1' : 'gap-1.5'}`}>
            {/* Steer: only offered once there's a draft to send. */}
            {value.trim() && (
              <button
                type="button"
                onClick={() => submit({ steer: true })}
                aria-label="Send now, interrupting the current response"
                title="Send now — interrupts the current response (⌘Enter)"
                className={`flex items-center justify-center rounded-full border border-accent-500/40 text-accent-600 transition hover:bg-accent-500/10 dark:text-accent-400 ${
                  compact ? 'size-8' : 'size-9'
                }`}
              >
                <SendIcon width={compact ? 16 : 18} height={compact ? 16 : 18} />
              </button>
            )}
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop response"
              title="Stop response (Enter queues)"
              className={`flex items-center justify-center rounded-full bg-accent-500 text-white shadow-md shadow-accent-500/30 transition hover:bg-accent-600 ${
                compact ? 'size-8' : 'size-9'
              }`}
            >
              <StopIcon width={compact ? 16 : 18} height={compact ? 16 : 18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => submit()}
            disabled={!value.trim() || disabled}
            aria-label="Send message"
            className={`ml-auto flex items-center justify-center rounded-full bg-accent-500 text-white shadow-md shadow-accent-500/30 transition hover:bg-accent-600 disabled:opacity-35 disabled:shadow-none ${
              compact ? 'size-8' : 'size-9'
            }`}
          >
            <SendIcon width={compact ? 16 : 18} height={compact ? 16 : 18} />
          </button>
        )}
      </div>
    </div>
  )
}
