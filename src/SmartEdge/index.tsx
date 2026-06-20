import { BezierEdge, BaseEdge, useReactFlow, useStore } from "@xyflow/react";
import { useCallback } from "react";
import type { ComponentType } from "react";
import { getSmartEdge } from "../getSmartEdge";
import { getSmartEdgeWaypoints } from "../getSmartEdge/getSmartEdgeWaypoints";
import {
  getAbsoluteNodes,
  excludeEdgeAncestorNodes,
  getFloatingEdgeParams,
} from "../functions";
import { buildControlPoints } from "./controlPointGeometry";
import { ControlPoint } from "./ControlPoint";
import type { ControlPointData, SetControlPoints } from "./ControlPoint";
import type { GetSmartEdgeOptions } from "../getSmartEdge";
import type { EdgeProps, Node, Edge } from "@xyflow/react";

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
   * Color used to render the editable control points. Defaults to a blue.
   */
  controlPointColor?: string;
};

/**
 * The `edge.data` shape consumed by editable smart edges: the ordered list of
 * active waypoints the edge is routed through.
 */
export interface SmartEditableEdgeData extends Record<string, unknown> {
  points?: ControlPointData[];
}

const DEFAULT_CONTROL_POINT_COLOR = "#3367d9";

const isControlPointData = (value: unknown): value is ControlPointData =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "string" &&
  "x" in value &&
  typeof value.x === "number" &&
  "y" in value &&
  typeof value.y === "number";

const isControlPointArray = (value: unknown): value is ControlPointData[] =>
  Array.isArray(value) && value.every(isControlPointData);

/**
 * Reads the active waypoints from an edge's `data`, tolerating any data shape
 * (returns an empty list when absent or malformed).
 */
const readControlPoints = (data: unknown): ControlPointData[] => {
  if (
    data !== null &&
    typeof data === "object" &&
    "points" in data &&
    isControlPointArray(data.points)
  ) {
    return data.points;
  }
  return [];
};

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

  let { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition } =
    edgeProps;
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
  const absoluteNodes = getAbsoluteNodes(nodes);
  const preparedNodes = excludeEdgeAncestorNodes(
    absoluteNodes,
    edgeProps.source,
    edgeProps.target,
  );

  // Floating edges (issue #13): derive the source/target connection points
  // from node geometry instead of the fixed handles. Skipped for self-loops or
  // when a node is missing its measured dimensions, falling back to the regular
  // handle-based coordinates.
  if (options.floating && edgeProps.source !== edgeProps.target) {
    const sourceNode = absoluteNodes.find(
      (node) => node.id === edgeProps.source,
    );
    const targetNode = absoluteNodes.find(
      (node) => node.id === edgeProps.target,
    );

    if (sourceNode?.measured && targetNode?.measured) {
      const { sx, sy, tx, ty, sourcePos, targetPos } = getFloatingEdgeParams(
        sourceNode,
        targetNode,
      );
      sourceX = sx;
      sourceY = sy;
      targetX = tx;
      targetY = ty;
      sourcePosition = sourcePos;
      targetPosition = targetPos;
    }
  }

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

  const smartResponse = options.editable
    ? getSmartEdgeWaypoints({
        ...commonParams,
        waypoints: activePoints.map((point) => ({ x: point.x, y: point.y })),
      })
    : getSmartEdge(commonParams);

  const FallbackEdge = options.fallback ?? BezierEdge;

  if (smartResponse instanceof Error) {
    return <FallbackEdge {...edgeProps} />;
  }

  const { edgeCenterX, edgeCenterY, svgPathString } = smartResponse;

  const baseEdge = (
    <BaseEdge
      path={svgPathString}
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
