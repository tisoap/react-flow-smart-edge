import { BezierEdge } from "@xyflow/react";
import { useContext } from "react";
import type { ComponentType } from "react";
import { SmartEdgeRoutingContext } from "../routing/routingContext";
import { useSmartEdgePath } from "../routing/useSmartEdgePath";
import type { ControlPointData } from "./ControlPoint";
import { warnOnceNoProvider } from "./noProviderWarning";
import { useEndpointNodesSelected } from "./smartEdgeSelection";
import { useHoppedPath } from "./smartEdgeHops";
import {
  prepareEdge,
  RoutedSmartEdge,
  hoppedClearRoute,
  PlaceholderFallback,
} from "./renderDecision";
import type { HopOptions } from "./smartEdgeHops";
import type { SmartEdgeBatchItemOptions } from "../routing/routeBatch";
import type { SmartEdgePreset } from "../smartEdgePresets";
import type { GetSmartEdgeOptions } from "../getSmartEdge";
import type { EdgeProps, Edge, XYPosition } from "@xyflow/react";

export type { HopOptions } from "./smartEdgeHops";

export type SmartEdgeOptions = GetSmartEdgeOptions & {
  fallback?: ComponentType<EdgeProps<Edge>>;
  /**
   * When enabled, the edge's source/target connection points are computed
   * dynamically from node geometry (the nearest border facing the other node)
   * instead of using the fixed handle positions, mirroring React Flow's
   * floating edges. See https://github.com/tisoap/react-flow-smart-edge/issues/13
   */
  floating?: boolean;
  /**
   * When enabled, the edge renders draggable control points (waypoints) that
   * the path is routed through, still avoiding nodes between each waypoint.
   * Waypoints are read from and persisted to `edge.data.points`; the consumer
   * owns persistence via React Flow's edge state. Click an inactive point to
   * add a waypoint, drag to move, right-click or press Delete to remove.
   * See https://github.com/tisoap/react-flow-smart-edge/issues/36
   */
  editable?: boolean;
  /**
   * When enabled, the edge is routed through fixed waypoints read from
   * `edge.data.checkpoints` without rendering draggable control points. Each
   * segment still uses pathfinding. Ignored when `editable` is also `true`.
   */
  checkpoints?: boolean;
  /**
   * Color used to render the editable control points. Defaults to a blue.
   */
  controlPointColor?: string;
  /**
   * Corner radius for the `smoothstep` preset. Serializable, so unlike a custom
   * `drawEdge` it survives the provider's routing pipeline to the worker.
   */
  borderRadius?: number;
  /**
   * Circuit-style "hops": where this edge crosses another smart edge of the
   * same `type` rendered beneath it, draw a small bridge arc over the crossing
   * so intersecting wires read cleanly (like a schematic). Only the step and
   * smooth-step variants are orthogonal enough for this; it is ignored on
   * editable/checkpoint edges. Pass `true` for defaults or a {@link HopOptions}
   * object to tune the arc radius, corner rounding, and tolerance.
   * See https://github.com/tisoap/react-flow-smart-edge/issues/61
   */
  hops?: boolean | HopOptions;
};

/**
 * The `edge.data` shape consumed by editable smart edges: the ordered list of
 * active waypoints the edge is routed through.
 */
export interface SmartEditableEdgeData extends Record<string, unknown> {
  points?: ControlPointData[];
}

/**
 * The `edge.data` shape consumed by checkpoint smart edges: the ordered list
 * of fixed graph-coordinate points the edge is routed through.
 */
export interface SmartCheckpointEdgeData extends Record<string, unknown> {
  checkpoints?: XYPosition[];
}

export interface SmartEdgeProps<
  EdgeType extends Edge = Edge,
> extends EdgeProps<EdgeType> {
  /** Which preset (`bezier`, `step`, …) resolves this edge's draw/pathfinding
   * on the routing side. Set for you by `createSmartEdge`. */
  preset: SmartEdgePreset;
  options: SmartEdgeOptions;
}

/** Extracts only the structured-clone-safe options the provider pipeline can
 * forward to the routing worker. Function options (`drawEdge`/`generatePath`)
 * cannot cross that boundary and are resolved from `preset` instead. */
const toBatchItemOptions = (
  options: SmartEdgeOptions,
): SmartEdgeBatchItemOptions => ({
  gridRatio: options.gridRatio,
  nodePadding: options.nodePadding,
  avoidAreas: options.avoidAreas,
  borderRadius: options.borderRadius,
});

/**
 * Routes an edge through the nearest `SmartEdgeProvider` and renders its path,
 * falling back to the preset's native edge whenever routing is unavailable
 * (no provider), pending, deferred (an endpoint is dragging and
 * `routeWhileDragging` is off), or the corridor is clear (unless hops are
 * enabled on a step/smooth-step edge, in which case the native skeleton is
 * still drawn so crossings can bridge).
 *
 * Requires a `SmartEdgeProvider` ancestor to route; without one it warns once
 * (in development) and renders the fallback edge. Custom `drawEdge` /
 * `generatePath` functions passed via `options` are ignored here — the
 * provider resolves those from `preset` — and remain available only through
 * the synchronous `getSmartEdge` API.
 */
export function SmartEdge<EdgeType extends Edge = Edge>({
  preset,
  options,
  ...edgeProps
}: Readonly<SmartEdgeProps<EdgeType>>) {
  const { id, source, target } = edgeProps;
  const context = useContext(SmartEdgeRoutingContext);

  const { endpoints, activePoints, waypoints } = prepareEdge(
    context,
    options,
    edgeProps,
  );

  const { route, isDragging } = useSmartEdgePath({
    id,
    source,
    target,
    sourceX: endpoints.sourceX,
    sourceY: endpoints.sourceY,
    targetX: endpoints.targetX,
    targetY: endpoints.targetY,
    sourcePosition: endpoints.sourcePosition,
    targetPosition: endpoints.targetPosition,
    preset,
    options: toBatchItemOptions(options),
    waypoints,
  });

  const hoppedPathString = useHoppedPath({
    edgeId: id,
    sourceX: endpoints.sourceX,
    sourceY: endpoints.sourceY,
    targetX: endpoints.targetX,
    targetY: endpoints.targetY,
    hops: options.hops,
    editable: options.editable,
    checkpoints: options.checkpoints,
  });

  const endpointsSelected = useEndpointNodesSelected(
    context?.store,
    source,
    target,
  );

  const FallbackEdge = options.fallback ?? BezierEdge;

  if (context === null) {
    warnOnceNoProvider();
    return <FallbackEdge {...edgeProps} />;
  }

  if ((isDragging && !context.options.routeWhileDragging) || route === null) {
    return (
      <PlaceholderFallback
        FallbackEdge={FallbackEdge}
        edgeProps={edgeProps}
        dragFallbackStyle={context.options.dragFallbackStyle}
      />
    );
  }

  if (route.kind === "clear") {
    if (hoppedPathString === null) {
      return <FallbackEdge {...edgeProps} />;
    }

    return (
      <RoutedSmartEdge
        edgeProps={edgeProps}
        route={hoppedClearRoute(hoppedPathString, endpoints)}
        endpoints={endpoints}
        hoppedPathString={hoppedPathString}
        options={options}
        activePoints={activePoints}
        showControlPoints={Boolean(edgeProps.selected) || endpointsSelected}
      />
    );
  }

  return (
    <RoutedSmartEdge
      edgeProps={edgeProps}
      route={route}
      endpoints={endpoints}
      hoppedPathString={hoppedPathString}
      options={options}
      activePoints={activePoints}
      showControlPoints={Boolean(edgeProps.selected) || endpointsSelected}
    />
  );
}

export type SmartEdgeFunction = typeof SmartEdge;
