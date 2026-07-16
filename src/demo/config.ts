// Branding and copy in one place — rename the assistant without hunting
// through components.
import type { Branding } from '../lib/branding'

export const APP_NAME = 'Aristotle'
export const MODEL_NAME = 'Aristotle AI'
export const DISCLAIMER = 'Aristotle can make mistakes. Verify important financial details.'

/** Branding passed into the (brand-agnostic) library via BrandingProvider. */
export const aristotleBranding: Branding = {
  appName: APP_NAME,
  modelName: MODEL_NAME,
  disclaimer: DISCLAIMER,
}
