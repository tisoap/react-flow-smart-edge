import { BezierEdge, BaseEdge, useReactFlow, useStore } from "@xyflow/react";
import { useCallback } from "react";
import type { ComponentType } from "react";
import { getSmartEdge } from "../getSmartEdge";
import { getSmartEdgeWaypoints } from "../getSmartEdge/getSmartEdgeWaypoints";
import { getAbsoluteNodes, excludeEdgeAncestorNodes } from "../functions";
import { buildControlPoints } from "./controlPointGeometry";
import { ControlPoint } from "./ControlPoint";
import type { ControlPointData, SetControlPoints } from "./ControlPoint";
import { readControlPoints } from "./smartEdgeData";
import { useHoppedPath } from "./smartEdgeHops";
import type { HopOptions } from "./smartEdgeHops";
import {
  applyFloatingEdgeCoordinates,
  resolveWaypointParams,
} from "./smartEdgeRouting";
import type { GetSmartEdgeOptions } from "../getSmartEdge";
import type { EdgeProps, Node, Edge, XYPosition } from "@xyflow/react";

export type { HopOptions } from "./smartEdgeHops";

/** Prefers the hopped path when hops produced one, else the routed path. */
const resolvePath = (hopped: string | null, routed: string): string =>
  hopped ?? routed;

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

const DEFAULT_CONTROL_POINT_COLOR = "#3367d9";

export interface SmartEdgeProps<
  EdgeType extends Edge = Edge,
  NodeType extends Node = Node,
> extends EdgeProps<EdgeType> {
  nodes: NodeType[];
  options: SmartEdgeOptions;
}

export function SmartEdge<
  EdgeType extends Edge = Edge,
  NodeType extends Node = Node,
>({
  nodes,
  options,
  ...edgeProps
}: Readonly<SmartEdgeProps<EdgeType, NodeType>>) {
  const { setEdges } = useReactFlow();

  const { id } = edgeProps;

  const areEndpointNodesSelected = useStore((store) => {
    const sourceSelected = store.nodeLookup.get(edgeProps.source)?.selected;
    const targetSelected = store.nodeLookup.get(edgeProps.target)?.selected;
    return Boolean(sourceSelected) || Boolean(targetSelected);
  });

  const setControlPoints = useCallback<SetControlPoints>(
    (update) => {
      setEdges((edges) =>
        edges.map((edge) => {
          if (edge.id !== id) return edge;
          const points = readControlPoints(edge.data);
          return { ...edge, data: { ...edge.data, points: update(points) } };
        }),
      );
    },
    [id, setEdges],
  );

  const absoluteNodes = getAbsoluteNodes(nodes);

  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } =
    applyFloatingEdgeCoordinates({
      floating: options.floating,
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
  const {
    style,
    label,
    labelStyle,
    labelShowBg,
    labelBgStyle,
    labelBgPadding,
    labelBgBorderRadius,
    markerEnd,
    markerStart,
    interactionWidth,
  } = edgeProps;

  // Resolve subflow child positions to absolute coordinates and drop the
  // edge's own container nodes from the obstacle set, so routing works inside
  // React Flow subflows (see issue #32).
  const preparedNodes = excludeEdgeAncestorNodes(
    absoluteNodes,
    edgeProps.source,
    edgeProps.target,
  );

  const activePoints = options.editable
    ? readControlPoints(edgeProps.data)
    : [];

  const commonParams = {
    sourcePosition,
    targetPosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
    options,
    nodes: preparedNodes,
  };

  const waypointParams = resolveWaypointParams(
    options,
    edgeProps.data,
    activePoints,
  );

  const smartResponse =
    options.editable || options.checkpoints
      ? getSmartEdgeWaypoints({ ...commonParams, waypoints: waypointParams })
      : getSmartEdge(commonParams);

  const hoppedPathString = useHoppedPath({
    nodes,
    edgeId: id,
    edgeType: edgeProps.type,
    sourceNodeId: edgeProps.source,
    targetNodeId: edgeProps.target,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    options,
    hops: options.hops,
    editable: options.editable,
    checkpoints: options.checkpoints,
  });

  const FallbackEdge = options.fallback ?? BezierEdge;

  if (smartResponse instanceof Error) {
    return <FallbackEdge {...edgeProps} />;
  }

  const { edgeCenterX, edgeCenterY, svgPathString } = smartResponse;
  const pathString = resolvePath(hoppedPathString, svgPathString);

  const baseEdge = (
    <BaseEdge
      path={pathString}
      labelX={edgeCenterX}
      labelY={edgeCenterY}
      label={label}
      labelStyle={labelStyle}
      labelShowBg={labelShowBg}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
      style={style}
      markerStart={markerStart}
      markerEnd={markerEnd}
      interactionWidth={interactionWidth}
    />
  );

  if (!options.editable) {
    return baseEdge;
  }

  const showControlPoints =
    Boolean(edgeProps.selected) || areEndpointNodesSelected;
  const controlPoints = buildControlPoints(
    { x: sourceX, y: sourceY },
    { x: targetX, y: targetY },
    activePoints,
    smartResponse.points,
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

export type SmartEdgeFunction = typeof SmartEdge;
