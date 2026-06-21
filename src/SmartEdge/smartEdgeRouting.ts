import { getFloatingEdgeParams } from "../functions";
import type { Node, Position } from "@xyflow/react";
import { readCheckpoints } from "./smartEdgeData";
import type { ControlPointData } from "./ControlPoint";

export interface WaypointRoutingOptions {
  editable?: boolean;
  checkpoints?: boolean;
}

export interface EdgeEndpointCoordinates {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
}

export const applyFloatingEdgeCoordinates = ({
  floating,
  sourceNodeId,
  targetNodeId,
  absoluteNodes,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: {
  floating: boolean | undefined;
  sourceNodeId: string;
  targetNodeId: string;
  absoluteNodes: Node[];
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
}): EdgeEndpointCoordinates => {
  if (!floating || sourceNodeId === targetNodeId) {
    return {
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    };
  }

  const sourceNode = absoluteNodes.find((node) => node.id === sourceNodeId);
  const targetNode = absoluteNodes.find((node) => node.id === targetNodeId);

  if (!sourceNode?.measured || !targetNode?.measured) {
    return {
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    };
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getFloatingEdgeParams(
    sourceNode,
    targetNode,
  );

  return {
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
  };
};

export const resolveWaypointParams = (
  options: WaypointRoutingOptions,
  data: unknown,
  activePoints: ControlPointData[],
): { x: number; y: number }[] => {
  if (options.editable) {
    return activePoints.map((point) => ({ x: point.x, y: point.y }));
  }

  if (options.checkpoints) {
    return readCheckpoints(data);
  }

  return [];
};
