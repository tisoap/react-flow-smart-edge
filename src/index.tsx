export { SmartBezierEdge } from "./SmartBezierEdge";
export { SmartStraightEdge } from "./SmartStraightEdge";
export { SmartStepEdge } from "./SmartStepEdge";
export { SmartSmoothStepEdge } from "./SmartSmoothStepEdge";
export { SmartEdge } from "./SmartEdge";
export { SmartFloatingEdge } from "./SmartFloatingEdge";
export { SmartFloatingConnectionLine } from "./SmartFloatingConnectionLine";
export { createSmartEdge } from "./createSmartEdge";
export { smartEdgePresets } from "./smartEdgePresets";
export { getSmartEdge } from "./getSmartEdge";
export {
  svgDrawSmoothLinePath,
  svgDrawStraightLinePath,
  svgDrawSmoothStepLinePath,
} from "./functions/drawSvgPath";
export {
  pathfindingAStarDiagonal,
  pathfindingAStarNoDiagonal,
  pathfindingJumpPointNoDiagonal,
} from "./functions/generatePath";
export {
  getFloatingEdgeParams,
  getNodeIntersection,
  getEdgePosition,
} from "./functions/getFloatingEdgeParams";

export type { SmartEdgeOptions } from "./SmartEdge";
export type { SmartFloatingConnectionLineProps } from "./SmartFloatingConnectionLine";
export type { SmartEdgePreset } from "./smartEdgePresets";
export type { ConfigureSmartEdgeOptions } from "./createSmartEdge";
export type { GetSmartEdgeOptions } from "./getSmartEdge";
export type {
  SVGDrawFunction,
  SmoothStepOptions,
} from "./functions/drawSvgPath";
export type { PathFindingFunction } from "./functions/generatePath";
export type { FloatingEdgeParams } from "./functions/getFloatingEdgeParams";
export type { Grid, GridNode } from "./pathfinding/grid";
export type { XYPosition } from "@xyflow/react";

/**
 * A rectangular area (in graph coordinates) that smart edges should route
 * around, in addition to the nodes. Used by the `avoidAreas` option, e.g. to
 * keep edges clear of edge labels. Alias of React Flow's `Rect`.
 */
export type { Rect as AvoidArea } from "@xyflow/react";
