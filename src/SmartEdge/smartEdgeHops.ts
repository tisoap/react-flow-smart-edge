import { useStore } from "@xyflow/react";
import { getSmartEdge } from "../getSmartEdge";
import {
  computeEdgeHops,
  drawOrthogonalHopPath,
  excludeEdgeAncestorNodes,
  getAbsoluteNodes,
  getEdgeEndpointsFromStore,
  toPolyline,
} from "../functions";
import type { EndpointInfo, InternalNodeLike } from "../functions";
import type { GetSmartEdgeOptions } from "../getSmartEdge";
import type { Edge, Node, Position, XYPosition } from "@xyflow/react";

/** Stable empties so disabled hop subscriptions never trigger re-renders. */
const EMPTY_EDGES: Edge[] = [];
const EMPTY_NODE_LOOKUP = new Map<string, InternalNodeLike>();

/**
 * Configuration for circuit-style "hops": small bridge arcs drawn where a
 * smart edge crosses another orthogonal smart edge rendered beneath it.
 */
export interface HopOptions {
  /** Radius of the bridge arc drawn at each crossing. Default `6`. */
  radius?: number;
  /**
   * Corner rounding radius applied to the whole edge while hops are active.
   * `0` (default) keeps sharp step corners; a positive value gives a
   * smooth-step look. For smooth-step edges set this to match your border
   * radius (React Flow's default is `5`).
   */
  borderRadius?: number;
  /** Axis-alignment / crossing tolerance in pixels. Default `0.5`. */
  epsilon?: number;
}

/** The `hops` value as accepted on options: a flag, a config object, or unset. */
export type HopSetting = boolean | HopOptions | undefined;

interface ResolvedHopConfig {
  radius: number;
  borderRadius: number;
  epsilon: number;
}

const DEFAULT_HOP_CONFIG: ResolvedHopConfig = {
  radius: 6,
  borderRadius: 0,
  epsilon: 0.5,
};

const resolveHopConfig = (hops: HopSetting): ResolvedHopConfig => {
  if (!hops || hops === true) return DEFAULT_HOP_CONFIG;
  return {
    radius: hops.radius ?? DEFAULT_HOP_CONFIG.radius,
    borderRadius: hops.borderRadius ?? DEFAULT_HOP_CONFIG.borderRadius,
    epsilon: hops.epsilon ?? DEFAULT_HOP_CONFIG.epsilon,
  };
};

/**
 * Routes a single underlying edge from the store and returns its orthogonal
 * polyline, or `null` if its endpoints or route cannot be resolved.
 */
const routeEdgePolyline = (
  edge: Edge,
  nodeLookup: Map<string, InternalNodeLike>,
  absoluteNodes: Node[],
  options: GetSmartEdgeOptions,
): XYPosition[] | null => {
  const endpoints = getEdgeEndpointsFromStore(nodeLookup, edge);
  if (!endpoints) return null;

  const route = getSmartEdge({
    ...endpoints,
    nodes: excludeEdgeAncestorNodes(absoluteNodes, edge.source, edge.target),
    options,
  });
  if (route instanceof Error) return null;

  return toPolyline(
    { x: endpoints.sourceX, y: endpoints.sourceY },
    { x: endpoints.targetX, y: endpoints.targetY },
    route.points,
  );
};

export interface ComputeHoppedPathParams<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
> {
  /** All edges from the React Flow store, in paint order. */
  edges: EdgeType[];
  /** The React Flow store's `nodeLookup`. */
  nodeLookup: Map<string, InternalNodeLike>;
  /** All nodes (used as routing obstacles). */
  nodes: NodeType[];
  /** This edge's id, used to find its paint order and crossings to bridge. */
  edgeId: string;
  /** This edge's `type`; only same-type edges underneath are bridged. */
  edgeType: string | undefined;
  /** This edge's source/target node ids (to exclude subflow ancestors). */
  sourceNodeId: string;
  targetNodeId: string;
  /** This edge's resolved source/target endpoints. */
  source: EndpointInfo;
  target: EndpointInfo;
  /** The routing options shared by edges of this type. */
  options: GetSmartEdgeOptions;
  /** The hop configuration (`true` for defaults, or an object to tune). */
  hops: HopSetting;
}

/**
 * Recomputes the SVG path for an orthogonal smart edge with circuit-style hops:
 * every other same-type edge rendered underneath this one (lower array index)
 * is re-routed, crossings are detected against this edge's routed polyline, and
 * a small bridge arc is drawn at each one.
 *
 * Returns the redrawn path string (even when there are no crossings, so corner
 * rounding stays consistent across hop edges), or `null` when hops cannot be
 * computed (this edge is missing, or its own route failed) — in which case the
 * caller should keep the edge's normal path.
 *
 * This is intentionally a per-edge recompute (O(n^2) over same-type edges); it
 * needs no consumer setup but can get expensive on large graphs.
 */
export const computeHoppedPath = <
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
>(
  params: ComputeHoppedPathParams<NodeType, EdgeType>,
): string | null => {
  const {
    edges,
    nodeLookup,
    nodes,
    edgeId,
    edgeType,
    sourceNodeId,
    targetNodeId,
    source,
    target,
    options,
  } = params;
  const config = resolveHopConfig(params.hops);

  const meIndex = edges.findIndex((edge) => edge.id === edgeId);
  if (meIndex < 0) return null;

  const absoluteNodes = getAbsoluteNodes(nodes);

  // Re-route this edge here so the hop segment indices line up exactly with the
  // polyline the drawer walks (rather than reusing the render's path string).
  const myRoute = getSmartEdge({
    sourceX: source.x,
    sourceY: source.y,
    sourcePosition: source.position,
    targetX: target.x,
    targetY: target.y,
    targetPosition: target.position,
    nodes: excludeEdgeAncestorNodes(absoluteNodes, sourceNodeId, targetNodeId),
    options,
  });
  if (myRoute instanceof Error) return null;

  const myPolyline = toPolyline(source, target, myRoute.points);

  // Route every same-type edge painted underneath this one so we know where it
  // crosses us; only those produce a bridge, keeping the top wire's bump visible.
  const otherPolylines: XYPosition[][] = [];
  for (let index = 0; index < meIndex; index++) {
    const other = edges[index];
    const polyline =
      other.type === edgeType
        ? routeEdgePolyline(other, nodeLookup, absoluteNodes, options)
        : null;
    if (polyline) otherPolylines.push(polyline);
  }

  const hops = computeEdgeHops(myPolyline, otherPolylines, config.epsilon);

  return drawOrthogonalHopPath(myPolyline, hops, {
    hopRadius: config.radius,
    borderRadius: config.borderRadius,
  });
};

export interface UseHoppedPathParams<NodeType extends Node = Node> {
  nodes: NodeType[];
  edgeId: string;
  edgeType: string | undefined;
  sourceNodeId: string;
  targetNodeId: string;
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
  options: GetSmartEdgeOptions;
  hops: HopSetting;
  /** Editable/checkpoint edges use a different draw pipeline and skip hops. */
  editable: boolean | undefined;
  checkpoints: boolean | undefined;
}

/**
 * Subscribes to the edges and node geometry hops need and returns the hopped
 * SVG path for this edge, or `null` when hops are disabled or cannot be
 * computed. Hops only apply to the orthogonal step variants, so they are
 * skipped for editable/checkpoint edges; subscriptions stay inert (a stable
 * empty list / `null`) while disabled.
 */
export const useHoppedPath = <NodeType extends Node = Node>(
  params: UseHoppedPathParams<NodeType>,
): string | null => {
  const enabled =
    Boolean(params.hops) && !params.editable && !params.checkpoints;
  const edges = useStore((store) => (enabled ? store.edges : EMPTY_EDGES));
  const nodeLookup = useStore((store) =>
    enabled ? store.nodeLookup : EMPTY_NODE_LOOKUP,
  );

  if (!enabled) return null;

  return computeHoppedPath({
    edges,
    nodeLookup,
    nodes: params.nodes,
    edgeId: params.edgeId,
    edgeType: params.edgeType,
    sourceNodeId: params.sourceNodeId,
    targetNodeId: params.targetNodeId,
    source: {
      x: params.sourceX,
      y: params.sourceY,
      position: params.sourcePosition,
    },
    target: {
      x: params.targetX,
      y: params.targetY,
      position: params.targetPosition,
    },
    options: params.options,
    hops: params.hops,
  });
};
