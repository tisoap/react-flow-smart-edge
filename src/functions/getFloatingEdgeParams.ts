import { Position } from "@xyflow/react";
import type { Node, XYPosition } from "@xyflow/react";

/**
 * The dynamic connection parameters for a floating edge: the source/target
 * intersection coordinates on each node's border, plus the side (position) of
 * the node those points sit on.
 */
export interface FloatingEdgeParams {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePos: Position;
  targetPos: Position;
}

const getNodeRect = (node: Node) => {
  const width = Math.max(node.measured?.width ?? 0, 1);
  const height = Math.max(node.measured?.height ?? 0, 1);
  return { x: node.position.x, y: node.position.y, width, height };
};

/**
 * Returns the point where the straight line between the centers of
 * `intersectionNode` and `otherNode` crosses the border of `intersectionNode`.
 *
 * Ported from React Flow's Floating Edges example
 * (https://reactflow.dev/examples/edges/floating-edges), adapted to this
 * library's `Node` shape (`measured` dimensions + absolute `position`).
 */
export const getNodeIntersection = (
  intersectionNode: Node,
  otherNode: Node,
): XYPosition => {
  const intersection = getNodeRect(intersectionNode);
  const other = getNodeRect(otherNode);

  const halfWidth = intersection.width / 2;
  const halfHeight = intersection.height / 2;

  const intersectionRight = intersection.x + halfWidth;
  const intersectionBottom = intersection.y + halfHeight;
  const otherCenterX = other.x + other.width / 2;
  const otherCenterY = other.y + other.height / 2;

  const normalizedX =
    (otherCenterX - intersectionRight) / (2 * halfWidth) -
    (otherCenterY - intersectionBottom) / (2 * halfHeight);
  const normalizedY =
    (otherCenterX - intersectionRight) / (2 * halfWidth) +
    (otherCenterY - intersectionBottom) / (2 * halfHeight);
  const scale = 1 / (Math.abs(normalizedX) + Math.abs(normalizedY) || 1);
  const scaledX = scale * normalizedX;
  const scaledY = scale * normalizedY;
  const intersectionX = halfWidth * (scaledX + scaledY) + intersectionRight;
  const intersectionY = halfHeight * (-scaledX + scaledY) + intersectionBottom;

  return { x: intersectionX, y: intersectionY };
};

/**
 * Returns the side of `node` (top/right/bottom/left) that `intersectionPoint`
 * sits on, used as the handle position fed into the pathfinding pipeline.
 */
export const getEdgePosition = (
  node: Node,
  intersectionPoint: XYPosition,
): Position => {
  const { x, y, width, height } = getNodeRect(node);
  const nodeX = Math.round(x);
  const nodeY = Math.round(y);
  const pointX = Math.round(intersectionPoint.x);
  const pointY = Math.round(intersectionPoint.y);

  if (pointX <= nodeX + 1) {
    return Position.Left;
  }
  if (pointX >= nodeX + width - 1) {
    return Position.Right;
  }
  if (pointY <= nodeY + 1) {
    return Position.Top;
  }
  if (pointY >= nodeY + height - 1) {
    return Position.Bottom;
  }

  return Position.Top;
};

/**
 * Computes the floating connection parameters between two nodes: the points
 * where the edge meets each node's border and the corresponding sides. Feed the
 * result into {@link getSmartEdge} to route a floating edge around obstacles.
 *
 * Both nodes are expected to carry absolute `position` coordinates (resolve any
 * subflow offsets with `getAbsoluteNodes` first) and `measured` dimensions.
 */
export const getFloatingEdgeParams = (
  sourceNode: Node,
  targetNode: Node,
): FloatingEdgeParams => {
  const sourceIntersectionPoint = getNodeIntersection(sourceNode, targetNode);
  const targetIntersectionPoint = getNodeIntersection(targetNode, sourceNode);

  const sourcePos = getEdgePosition(sourceNode, sourceIntersectionPoint);
  const targetPos = getEdgePosition(targetNode, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
};
