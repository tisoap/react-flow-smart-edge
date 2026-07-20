export { SmartBezierEdge } from "./SmartBezierEdge";
export { SmartStraightEdge } from "./SmartStraightEdge";
export { SmartStepEdge } from "./SmartStepEdge";
export { SmartSmoothStepEdge } from "./SmartSmoothStepEdge";
export { SmartSimpleBezierEdge } from "./SmartSimpleBezierEdge";
export { SmartEdge } from "./SmartEdge";
export { SmartFloatingEdge } from "./SmartFloatingEdge";
export { SmartEditableEdge } from "./SmartEditableEdge";
export { SmartCheckpointEdge } from "./SmartCheckpointEdge";
export { SmartFloatingConnectionLine } from "./SmartFloatingConnectionLine";
export { createSmartEdge } from "./createSmartEdge";
export { smartEdgePresets } from "./smartEdgePresets";
export { getSmartEdge } from "./getSmartEdge";
export { getSmartEdgeWaypoints } from "./getSmartEdge/getSmartEdgeWaypoints";
export { SmartEdgeProvider } from "./routing/SmartEdgeProvider";
export { useSmartEdgePath } from "./routing/useSmartEdgePath";
export { isDirectPathBlocked } from "./routing/obstacleIndex";
export { routeSmartEdgeBatch } from "./routing/routeBatch";
export {
  svgDrawSmoothLinePath,
  svgDrawStraightLinePath,
  svgDrawSmoothStepLinePath,
  svgDrawSimpleBezierLinePath,
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

export type {
  SmartEdgeOptions,
  SmartEditableEdgeData,
  SmartCheckpointEdgeData,
  HopOptions,
} from "./SmartEdge";
export type { ControlPointData } from "./SmartEdge/ControlPoint";
export type { GetSmartEdgeWaypointsParams } from "./getSmartEdge/getSmartEdgeWaypoints";
export type { SmartFloatingConnectionLineProps } from "./SmartFloatingConnectionLine";
export type { SmartEdgePreset } from "./smartEdgePresets";
export type { ConfigureSmartEdgeOptions } from "./createSmartEdge";
export type { GetSmartEdgeOptions } from "./getSmartEdge";
export type { SmartEdgeProviderProps } from "./routing/SmartEdgeProvider";
export type {
  SmartEdgeProviderOptions,
  SmartEdgeContextValue,
  ResolvedProviderOptions,
} from "./routing/routingContext";
export type {
  UseSmartEdgePathInput,
  UseSmartEdgePathResult,
} from "./routing/useSmartEdgePath";
export type { SmartEdgeRouteResult } from "./routing/providerStore";
export type {
  SmartEdgeMetrics,
  RegisteredSmartEdge,
} from "./routing/scheduler";
export type { SmartEdgeBatchItem } from "./routing/routeBatch";
export type {
  SVGDrawFunction,
  SVGSimpleBezierDrawFunction,
  DrawEdgeFunction,
  SmoothStepOptions,
} from "./functions/drawSvgPath";
export type { EndpointInfo } from "./functions/alignEndpoints";
export type { Direction } from "./functions/guaranteeWalkablePath";
export type { PathFindingFunction } from "./functions/generatePath";
export type { FloatingEdgeParams } from "./functions/getFloatingEdgeParams";
export type { ObstacleBox } from "./routing/obstacleIndex";
export type { FlatGrid } from "./pathfinding/flatGrid";
export type { XYPosition } from "@xyflow/react";

/**
 * A rectangular area (in graph coordinates) that smart edges should route
 * around, in addition to the nodes. Used by the `avoidAreas` option, e.g. to
 * keep edges clear of edge labels. Alias of React Flow's `Rect`.
 */
export type { Rect as AvoidArea } from "@xyflow/react";
