import { BaseEdge, useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { buildControlPoints } from "./controlPointGeometry";
import { ControlPoint } from "./ControlPoint";
import { readControlPoints } from "./smartEdgeData";
import {
  applyFloatingEdgeCoordinates,
  resolveWaypointParams,
} from "./smartEdgeRouting";
import type { ControlPointData, SetControlPoints } from "./ControlPoint";
import type { EdgeEndpointCoordinates } from "./smartEdgeRouting";
import type { SmartEdgeOptions } from "./index";
import type { SmartEdgeContextValue } from "../routing/routingContext";
import type { SmartEdgeRouteResult } from "../routing/providerStore";
import type { Edge, EdgeProps, Node, XYPosition } from "@xyflow/react";

/** The routed variant of a published route (never `clear`). */
export type RoutedRoute = Extract<SmartEdgeRouteResult, { kind: "routed" }>;

const DEFAULT_CONTROL_POINT_COLOR = "#3367d9";

/** Stable empty node list used when there is no provider. */
const EMPTY_NODES: Node[] = [];

/** Prefers the hopped path when hops produced one, else the routed path. */
const resolvePath = (hopped: string | null, routed: string): string =>
  hopped ?? routed;

/**
 * A `RoutedRoute` stand-in so a clear step edge can still render through
 * `RoutedSmartEdge` when hops produced a path (native skeleton plus any
 * bridge arcs). `wasRouted` stays `true` because that field is required on
 * the routed variant; the provider store still records `kind: "clear"`.
 */
export const hoppedClearRoute = (
  path: string,
  endpoints: EdgeEndpointCoordinates,
): RoutedRoute => ({
  kind: "routed",
  wasRouted: true,
  svgPathString: path,
  edgeCenterX: (endpoints.sourceX + endpoints.targetX) / 2,
  edgeCenterY: (endpoints.sourceY + endpoints.targetY) / 2,
  points: [],
});

/**
 * Applies a control-point update to the one matching edge in a React Flow edge
 * list, rewriting only its `data.points` and leaving every other edge (and the
 * matched edge's other data) untouched.
 */
export const applyControlPointsUpdate = (
  edges: Edge[],
  edgeId: string,
  update: (points: ControlPointData[]) => ControlPointData[],
): Edge[] =>
  edges.map((edge) => {
    if (edge.id !== edgeId) return edge;
    const points = readControlPoints(edge.data);
    return { ...edge, data: { ...edge.data, points: update(points) } };
  });

/** The per-render geometry a smart edge derives from its props and the
 * provider node snapshot: floating-resolved endpoints, the active editable
 * waypoints, and the waypoint list registered for routing. */
export interface PreparedEdge {
  endpoints: EdgeEndpointCoordinates;
  activePoints: ControlPointData[];
  waypoints: XYPosition[];
}

/**
 * Resolves an edge's routable geometry: floating endpoint override (using the
 * provider's absolute node snapshot, empty without a provider) and the
 * editable/checkpoint waypoints. Pure — no hooks — so the component stays a
 * thin orchestrator.
 */
export const prepareEdge = (
  context: SmartEdgeContextValue | null,
  options: SmartEdgeOptions,
  edgeProps: EdgeProps,
): PreparedEdge => {
  const absoluteNodes = context ? context.getNodesSnapshot() : EMPTY_NODES;
  const endpoints = applyFloatingEdgeCoordinates({
    floating: context ? options.floating : false,
    sourceNodeId: edgeProps.source,
    targetNodeId: edgeProps.target,
    absoluteNodes,
    sourceX: edgeProps.sourceX,
    sourceY: edgeProps.sourceY,
    targetX: edgeProps.targetX,
    targetY: edgeProps.targetY,
    sourcePosition: edgeProps.sourcePosition,
    targetPosition: edgeProps.targetPosition,
  });
  const activePoints = options.editable
    ? readControlPoints(edgeProps.data)
    : [];
  const waypoints = resolveWaypointParams(
    options,
    edgeProps.data,
    activePoints,
  );

  return { endpoints, activePoints, waypoints };
};

export interface RoutedSmartEdgeProps {
  edgeProps: EdgeProps;
  route: RoutedRoute;
  endpoints: EdgeEndpointCoordinates;
  hoppedPathString: string | null;
  options: SmartEdgeOptions;
  activePoints: ControlPointData[];
  showControlPoints: boolean;
}

/**
 * Renders a routed smart edge: the `BaseEdge` with the routed (or hopped) path,
 * plus the draggable control points overlay for editable edges when they are
 * revealed. Owns the `edge.data.points` persistence (via `setEdges`) so its
 * memoized updater only reads this edge's props, never the parent's.
 */
export function RoutedSmartEdge({
  edgeProps,
  route,
  endpoints,
  hoppedPathString,
  options,
  activePoints,
  showControlPoints,
}: Readonly<RoutedSmartEdgeProps>) {
  const { id } = edgeProps;
  const { setEdges } = useReactFlow();

  const setControlPoints = useCallback<SetControlPoints>(
    (update) => {
      setEdges((edges) => applyControlPointsUpdate(edges, id, update));
    },
    [id, setEdges],
  );

  const baseEdge = (
    <BaseEdge
      path={resolvePath(hoppedPathString, route.svgPathString)}
      labelX={route.edgeCenterX}
      labelY={route.edgeCenterY}
      label={edgeProps.label}
      labelStyle={edgeProps.labelStyle}
      labelShowBg={edgeProps.labelShowBg}
      labelBgStyle={edgeProps.labelBgStyle}
      labelBgPadding={edgeProps.labelBgPadding}
      labelBgBorderRadius={edgeProps.labelBgBorderRadius}
      style={edgeProps.style}
      markerStart={edgeProps.markerStart}
      markerEnd={edgeProps.markerEnd}
      interactionWidth={edgeProps.interactionWidth}
    />
  );

  if (!options.editable) {
    return baseEdge;
  }

  const controlPoints = buildControlPoints(
    { x: endpoints.sourceX, y: endpoints.sourceY },
    { x: endpoints.targetX, y: endpoints.targetY },
    activePoints,
    route.points,
  );
  const color = options.controlPointColor ?? DEFAULT_CONTROL_POINT_COLOR;

  return (
    <>
      {baseEdge}
      {showControlPoints &&
        controlPoints.map((point, index) => (
          <ControlPoint
            key={point.id}
            index={index}
            x={point.x}
            y={point.y}
            id={point.id}
            active={point.active}
            color={color}
            setControlPoints={setControlPoints}
          />
        ))}
    </>
  );
}
