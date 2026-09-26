// The workflow canvas kit — the portable half of this demo.
//
// Nothing in this folder imports from ../example or from the Aristotle app; it
// depends only on React, React Flow, and the shared component library's icons.
// Copy the folder, supply your own steps and stages, and you have a canvas.
// See ./README.md for the shortest possible host.
export { StepNode } from './StepNode'
export { StageNode } from './StageNode'
export { KindIcon } from './KindIcon'
export { StatusMark } from './StatusMark'
export { StageMarker } from './StageMarker'
export { CanvasLegend, ZoomCluster } from './chrome'
export { SelectStageProvider, SelectStepProvider, useSelectStage, useSelectStep } from './selection'
export {
  MIN_ZOOM,
  MAX_ZOOM,
  TIER_LABEL,
  tierForZoom,
  useZoomTier,
  useZoomPercent,
  type ZoomTier,
} from './zoom'
export {
  NODE_W,
  GATE_W,
  EDGE_STROKE,
  EDGE_DASH,
  edgeStyle,
  feeds,
  never,
  buildStepNodes,
  buildStageNodes,
  buildStepEdges,
  buildStageEdges,
  type EdgeSeed,
} from './build'
export { DEFAULT_STATUS_LABEL } from './types'
export type {
  AppNode,
  EdgeState,
  StageBase,
  StageData,
  StageLayout,
  StageNodeType,
  StageSeed,
  StageStatus,
  StatusMap,
  StepBase,
  StepData,
  StepDetail,
  StepKind,
  StepNodeType,
  StepSeed,
  StepStatus,
  View,
} from './types'
