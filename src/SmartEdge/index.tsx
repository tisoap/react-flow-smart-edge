import { BezierEdge, BaseEdge } from "@xyflow/react";
import type { ComponentType } from "react";
import { getSmartEdge } from "../getSmartEdge";
import {
  getAbsoluteNodes,
  excludeEdgeAncestorNodes,
  getFloatingEdgeParams,
} from "../functions";
import { useSmartEdgeDebug } from "../internal/useSmartEdgeDebug";
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
  const {
    enabled: isDebugEnabled,
    setGraphBox,
    setAvoidAreas,
  } = useSmartEdgeDebug();
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

  const smartResponse = getSmartEdge({
    sourcePosition,
    targetPosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
    options: {
      ...options,
      debug: { enabled: isDebugEnabled, setGraphBox, setAvoidAreas },
    },
    nodes: preparedNodes,
  });

  const FallbackEdge = options.fallback ?? BezierEdge;

  if (smartResponse instanceof Error) {
    if (isDebugEnabled) {
      console.error(smartResponse);
    }
    return <FallbackEdge {...edgeProps} />;
  }

  const { edgeCenterX, edgeCenterY, svgPathString } = smartResponse;

  return (
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
}

export type SmartEdgeFunction = typeof SmartEdge;
