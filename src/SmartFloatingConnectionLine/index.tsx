import { useNodes } from "@xyflow/react";
import { getSmartEdge } from "../getSmartEdge";
import { smartEdgePresets } from "../smartEdgePresets";
import {
  getAbsoluteNodes,
  getFloatingEdgeParams,
  svgDrawSmoothLinePath,
} from "../functions";
import type {
  ConnectionLineComponentProps,
  Node,
  XYPosition,
} from "@xyflow/react";
import type { GetSmartEdgeOptions } from "../getSmartEdge";

export type SmartFloatingConnectionLineProps = ConnectionLineComponentProps & {
  options?: GetSmartEdgeOptions;
};

/**
 * A connection line component (for React Flow's `connectionLineComponent` prop)
 * that previews a smart, obstacle-avoiding floating edge while the user drags a
 * new connection. The source point is derived from the origin node's geometry
 * (floating), the target follows the cursor, and the line is routed with the
 * same pathfinding as {@link SmartFloatingEdge}.
 *
 * Falls back to a straight preview line when no valid smart path can be found.
 */
export function SmartFloatingConnectionLine({
  fromNode,
  toX,
  toY,
  toPosition,
  connectionLineStyle,
  options,
}: Readonly<SmartFloatingConnectionLineProps>) {
  const nodes = useNodes();
  const absoluteNodes = getAbsoluteNodes(nodes);

  const cursorPosition: XYPosition = { x: toX, y: toY };
  const cursorNode: Node = {
    id: "smart-floating-connection-target",
    position: cursorPosition,
    data: {},
    measured: { width: 1, height: 1 },
  };

  const sourceNode: Node = {
    id: fromNode.id,
    position: fromNode.internals.positionAbsolute,
    data: {},
    measured: fromNode.measured,
  };

  const { sx, sy, sourcePos } = getFloatingEdgeParams(sourceNode, cursorNode);

  const mergedOptions: GetSmartEdgeOptions = {
    drawEdge: smartEdgePresets.bezier.drawEdge,
    generatePath: smartEdgePresets.bezier.generatePath,
    ...options,
  };

  const smartResponse = getSmartEdge({
    sourcePosition: sourcePos,
    targetPosition: toPosition,
    sourceX: sx,
    sourceY: sy,
    targetX: toX,
    targetY: toY,
    nodes: absoluteNodes,
    options: mergedOptions,
  });

  const svgPathString =
    smartResponse instanceof Error
      ? svgDrawSmoothLinePath({ x: sx, y: sy }, cursorPosition, [])
      : smartResponse.svgPathString;

  return (
    <g>
      <path
        fill="none"
        className="react-flow__connection-path"
        style={connectionLineStyle}
        d={svgPathString}
      />
      <circle cx={toX} cy={toY} r={3} stroke="black" strokeWidth={1.5} />
    </g>
  );
}

export type SmartFloatingConnectionLineFunction =
  typeof SmartFloatingConnectionLine;
