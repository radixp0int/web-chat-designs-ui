// Branding and copy in one place — rename the assistant without hunting
// through components.
import type { Branding } from '@chat/chat-ui'

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
