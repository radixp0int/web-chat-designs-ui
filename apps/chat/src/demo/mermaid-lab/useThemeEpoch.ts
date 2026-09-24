import { useEffect, useState } from 'react'

/**
 * Bumps a counter whenever the `dark`/`light` class on <html> changes.
 *
 * Official mermaid bakes concrete colors into its SVG, so it has to re-render on
 * that signal. beautiful-mermaid emits `var(--token)` references instead, so it
 * deliberately does *not* subscribe — that difference is one of the things the
 * lab measures.
 */
export function useThemeEpoch(): number {
  const [epoch, setEpoch] = useState(0)

  useEffect(() => {
    const observer = new MutationObserver(() => setEpoch((n) => n + 1))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  return epoch
}

/**
 * Flattens a CSS color onto `base` and returns an opaque `#rrggbb`.
 *
 * Two problems this solves at once. `getComputedStyle` returns brand.css's
 * `color-mix(in oklab, …)` tokens as `oklab(…)` strings, which mermaid's color
 * library (khroma) rejects outright — "Unsupported color format". And most of
 * these tokens are deliberately semi-transparent, which mermaid renders muddy.
 * The canvas does the conversion and the alpha compositing in one step.
 */
function flatten(cssColor: string, base: string): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.fillStyle = base
  ctx.fillRect(0, 0, 1, 1)
  // An unparseable value leaves fillStyle at its previous setting, which would
  // silently yield `base`; comparing detects that.
  const before = ctx.fillStyle
  ctx.fillStyle = cssColor
  if (ctx.fillStyle === before && cssColor !== base) return null
  ctx.fillRect(0, 0, 1, 1)

  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

/** Reads a custom property as it computes at `host`, before flattening. */
function rawToken(host: HTMLElement, token: string): string {
  const probe = document.createElement('span')
  probe.style.color = `var(${token})`
  probe.style.display = 'none'
  host.appendChild(probe)
  const value = getComputedStyle(probe).color
  probe.remove()
  return value
}

export function resolveToken(
  host: HTMLElement,
  token: string,
  base: string,
  fallback: string,
): string {
  const raw = rawToken(host, token)
  if (!raw) return fallback
  return flatten(raw, base) ?? fallback
}

export type DiagramPalette = {
  canvas: string
  panel: string
  ink: string
  inkSoft: string
  line: string
  accent: string
  code: string
}

/**
 * Reads the brand.css semantic tokens in effect at `host` as opaque hex.
 *
 * `--canvas` is resolved first over a plain white/black floor and then serves
 * as the compositing base for every other token, so translucent tokens like
 * `--line` and `--code-block` land on the color the diagram actually sits on.
 */
export function readPalette(host: HTMLElement): DiagramPalette {
  const dark = document.documentElement.classList.contains('dark')
  const floor = dark ? '#000000' : '#ffffff'
  const canvas = resolveToken(host, '--canvas', floor, floor)

  return {
    canvas,
    panel: resolveToken(host, '--panel-solid', canvas, canvas),
    ink: resolveToken(host, '--ink-strong', canvas, dark ? '#f5f5f7' : '#1c1c1e'),
    inkSoft: resolveToken(host, '--ink-soft', canvas, dark ? '#9aa0aa' : '#6b7280'),
    line: resolveToken(host, '--line', canvas, dark ? '#3a3f47' : '#d8dce3'),
    accent: resolveToken(host, '--accent', canvas, '#f97316'),
    code: resolveToken(host, '--code-block', canvas, canvas),
  }
}
