import { Position } from "@xyflow/react";
import type { Edge, XYPosition } from "@xyflow/react";

interface HandleBoundLike {
  id?: string | null;
  position: Position;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The subset of React Flow's internal node shape (`store.nodeLookup` values)
 * that hop detection needs to resolve another edge's handle coordinates without
 * having that edge's React Flow-computed `EdgeProps`.
 */
export interface InternalNodeLike {
  position: XYPosition;
  measured?: { width?: number; height?: number };
  internals?: {
    positionAbsolute?: XYPosition;
    handleBounds?: {
      source?: HandleBoundLike[] | null;
      target?: HandleBoundLike[] | null;
    } | null;
  };
}

/** Resolved source/target geometry for an edge, matching `getSmartEdge` input. */
export interface EdgeEndpoints {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
}

const FALLBACK_NODE_WIDTH = 150;
const FALLBACK_NODE_HEIGHT = 40;

/**
 * Resolves the absolute center and side of a node handle (by id, or the first
 * handle, with a sensible node-border fallback when handle bounds are missing).
 */
const resolveHandlePoint = (
  node: InternalNodeLike,
  handleId: string | null | undefined,
  type: "source" | "target",
): { x: number; y: number; position: Position } => {
  const absolute = node.internals?.positionAbsolute ?? node.position;
  const bounds = node.internals?.handleBounds?.[type] ?? [];
  const fallback = bounds.length > 0 ? bounds[0] : undefined;
  const handle =
    (handleId ? bounds.find((item) => item.id === handleId) : undefined) ??
    fallback;

  if (handle) {
    return {
      x: absolute.x + handle.x + handle.width / 2,
      y: absolute.y + handle.y + handle.height / 2,
      position: handle.position,
    };
  }

  const width = node.measured?.width ?? FALLBACK_NODE_WIDTH;
  const height = node.measured?.height ?? FALLBACK_NODE_HEIGHT;
  if (type === "source") {
    return {
      x: absolute.x + width,
      y: absolute.y + height / 2,
      position: Position.Right,
    };
  }
  return {
    x: absolute.x,
    y: absolute.y + height / 2,
    position: Position.Left,
  };
};

/**
 * Derives an edge's source/target coordinates and handle sides from the React
 * Flow store's `nodeLookup`, so hop detection can re-route sibling edges that it
 * does not own. Returns `null` when either endpoint node is missing.
 */
export const getEdgeEndpointsFromStore = (
  nodeLookup: Map<string, InternalNodeLike>,
  edge: Edge,
): EdgeEndpoints | null => {
  const sourceNode = nodeLookup.get(edge.source);
  const targetNode = nodeLookup.get(edge.target);
  if (!sourceNode || !targetNode) return null;

  const source = resolveHandlePoint(sourceNode, edge.sourceHandle, "source");
  const target = resolveHandlePoint(targetNode, edge.targetHandle, "target");

  return {
    sourceX: source.x,
    sourceY: source.y,
    targetX: target.x,
    targetY: target.y,
    sourcePosition: source.position,
    targetPosition: target.position,
  };
};
