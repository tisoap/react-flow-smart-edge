import { roundUp, roundDown } from "./utils";
import type { Node, Rect, XYPosition } from "@xyflow/react";

export interface NodeBoundingBox {
  id: string;
  width: number;
  height: number;
  topLeft: XYPosition;
  bottomLeft: XYPosition;
  topRight: XYPosition;
  bottomRight: XYPosition;
}

export interface GraphBoundingBox {
  width: number;
  height: number;
  topLeft: XYPosition;
  bottomLeft: XYPosition;
  topRight: XYPosition;
  bottomRight: XYPosition;
  xMax: number;
  yMax: number;
  xMin: number;
  yMin: number;
}

/**
 * Build the padded corner points of a rectangle, applying the same rounding
 * rules used for both nodes and avoid areas so they create consistent
 * obstacles on the path-finding grid.
 */
const buildBox = (
  x: number,
  y: number,
  width: number,
  height: number,
  nodePadding: number,
  roundTo: number,
) => {
  const topLeft: XYPosition = {
    x: x - nodePadding,
    y: y - nodePadding,
  };
  const bottomLeft: XYPosition = {
    x: x - nodePadding,
    y: y + height + nodePadding,
  };
  const topRight: XYPosition = {
    x: x + width + nodePadding,
    y: y - nodePadding,
  };
  const bottomRight: XYPosition = {
    x: x + width + nodePadding,
    y: y + height + nodePadding,
  };

  if (roundTo > 0) {
    topLeft.x = roundDown(topLeft.x, roundTo);
    topLeft.y = roundDown(topLeft.y, roundTo);
    bottomLeft.x = roundDown(bottomLeft.x, roundTo);
    bottomLeft.y = roundUp(bottomLeft.y, roundTo);
    topRight.x = roundUp(topRight.x, roundTo);
    topRight.y = roundDown(topRight.y, roundTo);
    bottomRight.x = roundUp(bottomRight.x, roundTo);
    bottomRight.y = roundUp(bottomRight.y, roundTo);
  }

  return { topLeft, bottomLeft, topRight, bottomRight };
};

/**
 * Get the bounding box of all nodes and the graph itself, as X/Y coordinates
 * of all corner points. Consumer-provided `avoidAreas` are treated as extra
 * obstacles with the same `nodePadding` clearance as nodes.
 */
export const getBoundingBoxes = (
  nodes: Node[],
  nodePadding = 2,
  roundTo = 2,
  avoidAreas: Rect[] = [],
) => {
  let xMax = Number.MIN_SAFE_INTEGER;
  let yMax = Number.MIN_SAFE_INTEGER;
  let xMin = Number.MAX_SAFE_INTEGER;
  let yMin = Number.MAX_SAFE_INTEGER;

  const expandBounds = (topLeft: XYPosition, bottomRight: XYPosition) => {
    if (topLeft.y < yMin) yMin = topLeft.y;
    if (topLeft.x < xMin) xMin = topLeft.x;
    if (bottomRight.y > yMax) yMax = bottomRight.y;
    if (bottomRight.x > xMax) xMax = bottomRight.x;
  };

  const nodeBoxes: NodeBoundingBox[] = nodes.map((node) => {
    const width = Math.max(node.measured?.width ?? 0, 1);
    const height = Math.max(node.measured?.height ?? 0, 1);

    const { topLeft, bottomLeft, topRight, bottomRight } = buildBox(
      node.position.x,
      node.position.y,
      width,
      height,
      nodePadding,
      roundTo,
    );

    expandBounds(topLeft, bottomRight);

    return {
      id: node.id,
      width,
      height,
      topLeft,
      bottomLeft,
      topRight,
      bottomRight,
    };
  });

  const avoidBoxes: NodeBoundingBox[] = avoidAreas.map((area, index) => {
    const width = Math.max(area.width, 1);
    const height = Math.max(area.height, 1);

    const { topLeft, bottomLeft, topRight, bottomRight } = buildBox(
      area.x,
      area.y,
      width,
      height,
      nodePadding,
      roundTo,
    );

    expandBounds(topLeft, bottomRight);

    return {
      id: `avoid-${String(index)}`,
      width,
      height,
      topLeft,
      bottomLeft,
      topRight,
      bottomRight,
    };
  });

  const graphPadding = nodePadding * 2;

  xMax = roundUp(xMax + graphPadding, roundTo);
  yMax = roundUp(yMax + graphPadding, roundTo);
  xMin = roundDown(xMin - graphPadding, roundTo);
  yMin = roundDown(yMin - graphPadding, roundTo);

  const topLeft: XYPosition = {
    x: xMin,
    y: yMin,
  };

  const bottomLeft: XYPosition = {
    x: xMin,
    y: yMax,
  };

  const topRight: XYPosition = {
    x: xMax,
    y: yMin,
  };

  const bottomRight: XYPosition = {
    x: xMax,
    y: yMax,
  };

  const width = Math.abs(topLeft.x - topRight.x);
  const height = Math.abs(topLeft.y - bottomLeft.y);

  const graphBox: GraphBoundingBox = {
    topLeft,
    bottomLeft,
    topRight,
    bottomRight,
    width,
    height,
    xMax,
    yMax,
    xMin,
    yMin,
  };

  return { nodeBoxes, graphBox, avoidBoxes };
};
