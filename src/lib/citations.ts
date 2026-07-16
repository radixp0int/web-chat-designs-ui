import { createContext, useContext } from 'react'
import type { Source } from './engine/chatEngine'

/**
 * Lets any citation chip deep inside a message open the reference frame
 * owned by the surface (App or ChatWidget) without prop drilling — the same
 * pattern as uiSize. The default is a no-op so ChatMessage renders safely
 * outside a provider.
 */
export type CiteHandler = (sources: Source[], id: number) => void

const CitationsContext = createContext<CiteHandler>(() => {})

export const CitationsProvider = CitationsContext.Provider

export function useCite(): CiteHandler {
  return useContext(CitationsContext)
}
