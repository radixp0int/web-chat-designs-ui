// Branding and copy in one place — rename the assistant without hunting
// through components.
import type { Branding } from '@chat/chat-ui'

// The workflows app keeps its own copy (apps/workflows/src/config.ts) — one
// string is not worth a shared package. Change both together.
export const APP_NAME = 'Aristotle'
export const MODEL_NAME = 'Aristotle AI'
export const DISCLAIMER = 'Aristotle can make mistakes. Verify important financial details.'

/** Branding passed into the (brand-agnostic) library via BrandingProvider. */
export const aristotleBranding: Branding = {
  appName: APP_NAME,
  modelName: MODEL_NAME,
  disclaimer: DISCLAIMER,
}

/**
 * The signed-in viewer. Fictional, but held in one place because two surfaces
 * render it now — the sidebar's account button and the user-settings dialog it
 * opens — and they must not drift apart.
 */
export const DEMO_USER = {
  name: 'John Ozzo',
  /** Drawn in the avatar; a real app derives or uploads this. */
  initials: 'JO',
  email: 'john.ozzo@alderfinch.example',
  plan: 'Performance plan',
}

/**
 * The workflows app, a separate deploy — where the landing page's workflow
 * cards go. Required: vite.config.ts fails a build without it rather than ship
 * cards that link nowhere.
 */
export const WORKFLOWS_URL = import.meta.env.VITE_WORKFLOWS_URL as string
