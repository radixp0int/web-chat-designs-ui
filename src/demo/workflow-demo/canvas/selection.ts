// Selecting a step from inside a custom node.
//
// React Flow renders node components itself, so the page cannot hand them props.
// Context reaches them without putting a callback in node data, where it would
// invalidate the node memo every time the graph is rebuilt.
import { createContext, useContext } from 'react'

const SelectStepContext = createContext<(id: string) => void>(() => {})

export const SelectStepProvider = SelectStepContext.Provider

export const useSelectStep = () => useContext(SelectStepContext)
