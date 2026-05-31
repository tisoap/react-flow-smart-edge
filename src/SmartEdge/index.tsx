import { BezierEdge, BaseEdge } from "@xyflow/react";
import type { ComponentType } from "react";
import { getSmartEdge } from "../getSmartEdge";
import { getAbsoluteNodes, excludeEdgeAncestorNodes } from "../functions";
import { useSmartEdgeDebug } from "../internal/useSmartEdgeDebug";
import type { GetSmartEdgeOptions } from "../getSmartEdge";
import type { EdgeProps, Node, Edge } from "@xyflow/react";

export type SmartEdgeOptions = GetSmartEdgeOptions & {
  fallback?: ComponentType<EdgeProps<Edge>>;
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
  const { enabled: isDebugEnabled, setGraphBox } = useSmartEdgeDebug();
  const {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
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
    getAbsoluteNodes(nodes),
    edgeProps.source,
    edgeProps.target,
  );

  const smartResponse = getSmartEdge({
    sourcePosition,
    targetPosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
    options: {
      ...options,
      debug: { enabled: isDebugEnabled, setGraphBox },
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
