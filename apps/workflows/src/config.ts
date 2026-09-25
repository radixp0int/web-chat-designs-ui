// The product name. The chat app has its own copy (apps/chat/src/demo/config.ts)
// — one string is not worth a shared package, and a UI package that knew the
// product name would be worse than the duplicate. Change both together.
export const APP_NAME = 'Aristotle'

/**
 * The chat app — home for "Back to Demos", since the landing page lives there.
 * Required: vite.config.ts fails a build without it rather than ship a link
 * home that goes nowhere.
 */
export const CHAT_URL = import.meta.env.VITE_CHAT_URL as string
