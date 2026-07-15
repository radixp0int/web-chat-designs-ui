import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  CollapseVerticalIcon,
  ExpandVerticalIcon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
  SendIcon,
  SparkleIcon,
  XIcon,
} from "./Icons";

import { personas, type PersonaId } from "../personas";

// Once the draft passes this length, offer to expand the textarea vertically.
const EXPAND_THRESHOLD = 200;
const HEIGHT_COLLAPSED = 180;
// When expanded, grow up to this fraction of the viewport height.
const EXPANDED_VIEWPORT_RATIO = 0.6;

// Minimal typing for the (prefixed) Web Speech API
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

type ComposerProps = {
  docked: boolean;
  disabled: boolean;
  onSubmit: (text: string) => void;
  persona: PersonaId;
  onPersonaChange: (id: PersonaId) => void;
};

export function Composer({
  docked,
  disabled,
  onSubmit,
  persona,
  onPersonaChange,
}: ComposerProps) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const canExpand = value.length >= EXPAND_THRESHOLD;
  // Only honor the expanded state while the draft is long enough to warrant it.
  const expandedHeight = expanded && canExpand;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechSupported = useRef(getSpeechRecognition() !== null);

  // Auto-grow the textarea with the content, up to the current cap. When
  // expanded the cap is a fraction of the viewport, so it tracks window height.
  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    if (!value) return;
    const cap = expandedHeight
      ? Math.round(window.innerHeight)
      : HEIGHT_COLLAPSED;
    el.style.height = `${Math.min(el.scrollHeight, cap)}px`;
  }, [value, expandedHeight]);

  useEffect(() => {
    resize();
  }, [resize]);

  // Keep the expanded height in step with viewport resizes.
  useEffect(() => {
    if (!expandedHeight) return;
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [expandedHeight, resize]);

  // Close the persona menu on outside click
  useEffect(() => {
    if (!personaOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setPersonaOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [personaOpen]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const chunk = Array.from(
        { length: event.results.length },
        (_, i) => event.results[i][0].transcript,
      )
        .join(" ")
        .trim();
      if (chunk) setValue((prev) => (prev ? `${prev} ${chunk}` : chunk));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    textareaRef.current?.focus();
  }

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    recognitionRef.current?.stop();
    setValue("");
    setAttachments([]);
    setExpanded(false);
    onSubmit(text);
  }

  const activePersona = personas.find((p) => p.id === persona)!;

  return (
    <div
      className={`glass w-full rounded-3xl shadow-lg shadow-brand-600/5 transition-shadow duration-300 focus-within:shadow-xl focus-within:shadow-brand-600/10 dark:shadow-black/20 ${
        docked ? "" : "shadow-xl"
      }`}
    >
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {attachments.map((name) => (
            <span
              key={name}
              className="flex items-center gap-1.5 rounded-full bg-brand-600/10 py-1 pr-1.5 pl-3 text-xs font-medium text-brand-600 dark:bg-brand-300/15 dark:text-brand-200"
            >
              <PaperclipIcon width={13} height={13} />
              <span className="max-w-40 truncate">{name}</span>
              <button
                type="button"
                onClick={() =>
                  setAttachments((a) => a.filter((n) => n !== name))
                }
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
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={docked ? 1 : 2}
          placeholder={listening ? "Listening…" : "Ask anything…"}
          aria-label="Message Meridian"
          className={`w-full resize-none bg-transparent pt-4 pb-1 pl-5 text-[15px] leading-relaxed text-(--text-strong) outline-none placeholder:text-(--text-soft) ${
            canExpand ? "pr-12" : "pr-5"
          }`}
        />

        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-pressed={expanded}
            aria-label={expanded ? "Collapse input" : "Expand input"}
            title={expanded ? "Collapse" : "Expand"}
            className="absolute top-2.5 right-3 rounded-lg p-1.5 text-(--text-soft) transition hover:bg-brand-600/8 hover:text-(--text-strong) dark:hover:bg-white/8"
          >
            {expanded ? (
              <CollapseVerticalIcon width={16} height={16} />
            ) : (
              <ExpandVerticalIcon width={16} height={16} />
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 px-3 pb-3">
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const names = Array.from(e.target.files ?? []).map((f) => f.name);
            setAttachments((prev) => [...new Set([...prev, ...names])]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full p-2 text-(--text-soft) transition hover:bg-brand-600/8 hover:text-(--text-strong) dark:hover:bg-white/8"
          aria-label="Attach files"
          title="Attach files"
        >
          <PlusIcon />
        </button>

        {speechSupported.current && (
          <button
            type="button"
            onClick={toggleMic}
            aria-pressed={listening}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            title="Voice to text"
            className={`relative rounded-full p-2 transition ${
              listening
                ? "bg-accent-500/15 text-accent-600 dark:text-accent-400"
                : "text-(--text-soft) hover:bg-brand-600/8 hover:text-(--text-strong) dark:hover:bg-white/8"
            }`}
          >
            {listening && (
              <span
                className="absolute inset-0 animate-ping rounded-full bg-accent-500/30"
                aria-hidden
              />
            )}
            <MicIcon />
          </button>
        )}

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setPersonaOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={personaOpen}
            className="flex items-center gap-1.5 rounded-full bg-brand-600/8 px-3.5 py-2 text-[13px] font-semibold text-brand-600 transition hover:bg-brand-600/14 dark:bg-brand-300/12 dark:text-brand-200 dark:hover:bg-brand-300/20"
          >
            <SparkleIcon width={14} height={14} className="text-accent-500" />
            {activePersona.name}
            <ChevronDownIcon
              width={14}
              height={14}
              className={`transition-transform ${personaOpen ? "rotate-180" : ""}`}
            />
          </button>

          {personaOpen && (
            <ul
              role="listbox"
              aria-label="Chat persona"
              className="absolute bottom-full left-0 z-20 mb-2 w-56 overflow-hidden rounded-2xl border border-(--panel-border) bg-(--panel-solid) p-1.5 shadow-xl shadow-brand-950/20"
            >
              {personas.map((p) => (
                <li key={p.id} role="option" aria-selected={p.id === persona}>
                  <button
                    type="button"
                    onClick={() => {
                      onPersonaChange(p.id);
                      setPersonaOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-brand-600/8 dark:hover:bg-white/8"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-(--text-strong)">
                        {p.name}
                      </span>
                      <span className="block text-xs text-(--text-soft)">
                        {p.hint}
                      </span>
                    </span>
                    {p.id === persona && (
                      <CheckIcon
                        width={15}
                        height={15}
                        className="text-accent-500"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!value.trim() || disabled}
          aria-label="Send message"
          className="ml-auto flex size-9 items-center justify-center rounded-full bg-accent-500 text-white shadow-md shadow-accent-500/30 transition hover:bg-accent-600 disabled:opacity-35 disabled:shadow-none"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
