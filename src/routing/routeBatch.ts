import { getSmartEdge } from "../getSmartEdge";
import { getSmartEdgeWaypoints } from "../getSmartEdge/getSmartEdgeWaypoints";
import { getAbsoluteNodes, excludeEdgeAncestorNodes } from "../functions";
import { resolvePresetRouting } from "./routingRegistry";
import type { SmartEdgeRouteResult } from "./providerStore";
import type { SmartEdgePreset } from "../smartEdgePresets";
import type { Node, Position, Rect, XYPosition } from "@xyflow/react";

/**
 * The subset of `GetSmartEdgeOptions` that can be sent to the routing Web
 * Worker. Function options (`drawEdge`/`generatePath`) are excluded because
 * functions cannot cross the `postMessage` boundary; the worker resolves
 * those from the edge's `preset` instead.
 */
export interface SmartEdgeBatchItemOptions {
  gridRatio?: number;
  nodePadding?: number;
  avoidAreas?: Rect[];
  /** Corner radius for the `smoothstep` preset. */
  borderRadius?: number;
}

/**
 * One edge to route, with endpoints already resolved on the main thread and
 * everything else stripped to structured-clone-safe data (no functions), so
 * the whole batch can cross the `postMessage` boundary to the routing worker.
 */
export interface SmartEdgeBatchItem {
  id: string;
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  preset: SmartEdgePreset;
  options?: SmartEdgeBatchItemOptions;
  /**
   * Intermediate points (in graph coordinates) the edge must pass through,
   * in order from source to target. Routes through `getSmartEdgeWaypoints`
   * instead of plain `getSmartEdge` when present and non-empty.
   */
  waypoints?: XYPosition[];
}

/**
 * A batch of edges to route against one shared node set, tagged with a
 * monotonically increasing `requestId` so the caller can ignore responses
 * for superseded requests.
 */
export interface SmartEdgeBatchRequest {
  requestId: number;
  nodes: Node[];
  edges: SmartEdgeBatchItem[];
}

/** The worker's reply: routed results keyed by edge id, plus how long
 * routing took. Edges that failed to route are omitted from `results`. */
export interface SmartEdgeBatchResponse {
  requestId: number;
  results: Record<string, SmartEdgeRouteResult>;
  durationMs: number;
}

/**
 * Routes many smart edges against a shared node set in one pass. This is the
 * pure core used both inside the Web Worker and as the main-thread fallback,
 * so it must not depend on the DOM or React. Nodes resolve to absolute
 * (subflow-aware) coordinates once for the whole batch; each edge then
 * excludes its own ancestor containers from the obstacle set, resolves its
 * preset to the matching `drawEdge`/`generatePath`, and routes through
 * `getSmartEdgeWaypoints` when it carries waypoints or plain `getSmartEdge`
 * otherwise. Edges that fail to route are omitted so the edge component keeps
 * rendering its fallback.
 */
export const routeSmartEdgeBatch = (
  nodes: Node[],
  edges: SmartEdgeBatchItem[],
): Record<string, SmartEdgeRouteResult> => {
  const absoluteNodes = getAbsoluteNodes(nodes);
  const results: Record<string, SmartEdgeRouteResult> = {};

  for (const edge of edges) {
    const preparedNodes = excludeEdgeAncestorNodes(
      absoluteNodes,
      edge.source,
      edge.target,
    );
    const { drawEdge, generatePath } = resolvePresetRouting(
      edge.preset,
      edge.options?.borderRadius,
    );

    const params = {
      sourceX: edge.sourceX,
      sourceY: edge.sourceY,
      targetX: edge.targetX,
      targetY: edge.targetY,
      sourcePosition: edge.sourcePosition,
      targetPosition: edge.targetPosition,
      nodes: preparedNodes,
      options: {
        drawEdge,
        generatePath,
        gridRatio: edge.options?.gridRatio,
        nodePadding: edge.options?.nodePadding,
        avoidAreas: edge.options?.avoidAreas,
      },
    };

    const result = edge.waypoints?.length
      ? getSmartEdgeWaypoints({ ...params, waypoints: edge.waypoints })
      : getSmartEdge(params);

    if (!(result instanceof Error)) {
      results[edge.id] = { ...result, kind: "routed", wasRouted: true };
    }
  }

  return results;
};
