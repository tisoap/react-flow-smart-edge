import { getSmartEdge } from "../getSmartEdge";
import { getAbsoluteNodes, excludeEdgeAncestorNodes } from "../functions";
import { resolvePresetRouting } from "./routingRegistry";
import type { GetSmartEdgeReturn } from "../getSmartEdge";
import type { SmartEdgePreset } from "../smartEdgePresets";
import type { Node, Position, Rect } from "@xyflow/react";

/**
 * The subset of {@link GetSmartEdgeOptions} that can be sent to the routing
 * Web Worker. Function options (`drawEdge`/`generatePath`) are excluded because
 * functions cannot cross the `postMessage` boundary; the worker resolves those
 * from the edge's `preset` instead.
 */
export interface SerializableSmartEdgeOptions {
  gridRatio?: number;
  nodePadding?: number;
  avoidAreas?: Rect[];
  /** Corner radius for the `smoothstep` preset. */
  borderRadius?: number;
}

/** Provider defaults applied to every edge, with an optional default preset. */
export interface SmartEdgeBatchOptions extends SerializableSmartEdgeOptions {
  preset?: SmartEdgePreset;
}

/** Per-edge override, read from `edge.data.smartEdge`. */
export interface SmartEdgeBatchOverride {
  preset?: SmartEdgePreset;
  options?: SerializableSmartEdgeOptions;
}

/** The `edge.data` shape `useSmartEdgeRoute` reads per-edge overrides from. */
export interface SmartEdgeBatchEdgeData extends Record<string, unknown> {
  smartEdge?: SmartEdgeBatchOverride;
}

/** A single edge to route, with endpoints already resolved on the main thread. */
export interface BatchEdgeInput {
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
  options?: SerializableSmartEdgeOptions;
}

/** Everything needed to route a batch of edges against one set of nodes. */
export interface BatchRoutingInput {
  nodes: Node[];
  edges: BatchEdgeInput[];
}

/** Routed results keyed by edge id. Edges that fail to route are omitted. */
export type BatchRoutingResults = Record<string, GetSmartEdgeReturn>;

/**
 * Route many smart edges against a shared node set in one pass. This is the
 * pure core used both inside the Web Worker and as the main-thread fallback,
 * so it must not depend on the DOM or React. Each edge resolves its preset to
 * the matching `drawEdge`/`generatePath` and runs through {@link getSmartEdge};
 * subflow ancestor containers are excluded per edge, exactly like `SmartEdge`.
 */
export const routeSmartEdgesBatch = (
  input: BatchRoutingInput,
): BatchRoutingResults => {
  const absoluteNodes = getAbsoluteNodes(input.nodes);
  const results: BatchRoutingResults = {};

  for (const edge of input.edges) {
    const preparedNodes = excludeEdgeAncestorNodes(
      absoluteNodes,
      edge.source,
      edge.target,
    );
    const { drawEdge, generatePath } = resolvePresetRouting(
      edge.preset,
      edge.options?.borderRadius,
    );

    const result = getSmartEdge({
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
    });

    if (!(result instanceof Error)) {
      results[edge.id] = result;
    }
  }

  return results;
};
