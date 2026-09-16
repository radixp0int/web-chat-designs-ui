// Level of detail.
//
// Text cannot simply keep shrinking: at 60% zoom a 13.5px label renders at 8px
// and is gone. So each step down drops content and counter-scales what is left,
// which is why the tiers live here rather than in a CSS media query.
//
// The selector returns the BUCKET, not the zoom. Every node subscribes to it, so
// returning a string means a node re-renders when the tier changes rather than
// on every frame of a pinch.
import { useStore } from '@xyflow/react'

export type ZoomTier = 'detail' | 'simplified' | 'glyph'

/** Below this, even the icons stop reading — so there is nothing to gain. */
export const MIN_ZOOM = 0.3
export const MAX_ZOOM = 1.5

export function tierForZoom(zoom: number): ZoomTier {
  if (zoom >= 0.7) return 'detail'
  if (zoom >= 0.45) return 'simplified'
  return 'glyph'
}

export function useZoomTier(): ZoomTier {
  return useStore((s) => tierForZoom(s.transform[2]))
}

/** The live zoom, for the readout only — this one does change every frame. */
export function useZoomPercent(): number {
  return useStore((s) => Math.round(s.transform[2] * 100))
}

export const TIER_LABEL: Record<ZoomTier, string> = {
  detail: 'Detail',
  simplified: 'Simplified',
  glyph: 'Glyph',
}
