// Selecting things from inside a custom node.
//
// React Flow renders node components itself, so the page cannot hand them props.
// Context reaches them without putting a callback in node data, where it would
// invalidate the node memo every time the graph is rebuilt.
import { createContext, useContext } from 'react'

const SelectStepContext = createContext<(id: string) => void>(() => {})

export const SelectStepProvider = SelectStepContext.Provider

export const useSelectStep = () => useContext(SelectStepContext)

/** Picking a whole stage — the compact view's card header, or the host's outline. */
const SelectStageContext = createContext<(id: string) => void>(() => {})

export const SelectStageProvider = SelectStageContext.Provider

export const useSelectStage = () => useContext(SelectStageContext)
