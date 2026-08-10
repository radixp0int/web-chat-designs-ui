import { createContext, useCallback, useContext, useEffect, useState } from 'react'

/**
 * Which parts of a response the demo currently shows. These are presenter
 * controls, not product settings: they exist so the same answer can be walked
 * through with and without reasoning, tools, citations, or follow-ups.
 *
 * Demo-only by design — the flags live here rather than in lib/, and gating
 * happens by stripping message fields (see applyDemoFeatures) so no shared
 * component has to know a flag exists.
 */
export type DemoFeatureId = 'thinking' | 'tools' | 'sources' | 'followups' | 'actions'

export type DemoFlags = Record<DemoFeatureId, boolean>

export const DEFAULT_FLAGS: DemoFlags = {
  thinking: true,
  tools: true,
  sources: true,
  followups: true,
  actions: true,
}

export const DEMO_FEATURES: Record<DemoFeatureId, { label: string; hint: string }> = {
  thinking: {
    label: 'Reasoning',
    hint: 'The collapsible “Thought for Ns” block above the answer.',
  },
  tools: {
    label: 'Tool calls',
    hint: 'Status chips for each tool, expandable to their input and output.',
  },
  sources: {
    label: 'Sources and citations',
    hint: 'Inline [n] markers, the source strip, and the reference panel.',
  },
  followups: {
    label: 'Follow-up suggestions',
    hint: 'Suggested next prompts branching off the newest answer.',
  },
  actions: {
    label: 'Message actions',
    hint: 'Copy, regenerate, and the thumbs-up / thumbs-down vote.',
  },
}

/** Grouped by where the feature lands in a streamed turn — the order a
 *  presenter narrates it, and the order the modal lists them in. */
export const DEMO_FEATURE_GROUPS: { phase: string; features: DemoFeatureId[] }[] = [
  { phase: 'Before the answer', features: ['thinking', 'tools'] },
  { phase: 'In the answer', features: ['sources'] },
  { phase: 'After the answer', features: ['followups', 'actions'] },
]

const STORAGE_KEY = 'demo-features'

/** Stored flags are merged over the defaults, so a flag added later still
 *  starts on for someone with an older blob saved. */
function readStored(): DemoFlags {
  if (typeof window === 'undefined') return DEFAULT_FLAGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_FLAGS
    const parsed = JSON.parse(raw) as Partial<DemoFlags>
    return { ...DEFAULT_FLAGS, ...parsed }
  } catch {
    return DEFAULT_FLAGS
  }
}

export type DemoFeaturesValue = {
  flags: DemoFlags
  setFlag: (id: DemoFeatureId, on: boolean) => void
  reset: () => void
}

/** Owns the flag state and its persistence. Called once, by the app shell —
 *  which needs the flags in its own render as well as providing them below. */
export function useDemoFeatureState(): DemoFeaturesValue {
  const [flags, setFlags] = useState<DemoFlags>(readStored)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
  }, [flags])

  const setFlag = useCallback((id: DemoFeatureId, on: boolean) => {
    setFlags((f) => ({ ...f, [id]: on }))
  }, [])

  const reset = useCallback(() => setFlags(DEFAULT_FLAGS), [])

  return { flags, setFlag, reset }
}

const DemoFeaturesContext = createContext<DemoFeaturesValue>({
  flags: DEFAULT_FLAGS,
  setFlag: () => {},
  reset: () => {},
})

export const DemoFeaturesProvider = DemoFeaturesContext.Provider

export function useDemoFeatures(): DemoFeaturesValue {
  return useContext(DemoFeaturesContext)
}
