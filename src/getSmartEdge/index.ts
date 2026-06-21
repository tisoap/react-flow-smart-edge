import {
  alignEndpoints,
  createGrid,
  getBoundingBoxes,
  gridToGraphPoint,
  pathfindingAStarDiagonal,
  svgDrawSmoothLinePath,
  toInteger,
} from "../functions";
import type {
  PointInfo,
  PathFindingFunction,
  DrawEdgeFunction,
} from "../functions";
import type { Node, EdgeProps, Rect } from "@xyflow/react";

export type EdgeParams = Pick<
  EdgeProps,
  | "sourceX"
  | "sourceY"
  | "targetX"
  | "targetY"
  | "sourcePosition"
  | "targetPosition"
>;

export interface GetSmartEdgeOptions {
  gridRatio?: number;
  nodePadding?: number;
  drawEdge?: DrawEdgeFunction;
  generatePath?: PathFindingFunction;
  /**
   * Extra rectangular areas (in graph coordinates) the path should route
   * around, in addition to the nodes. Useful for keeping edges clear of edge
   * labels or any other arbitrary regions. Each area uses the same
   * `nodePadding` clearance as nodes.
   */
  avoidAreas?: Rect[];
}

export type GetSmartEdgeParams<
  NodeDataType extends Record<string, unknown> = Record<string, unknown>,
> = EdgeParams & {
  options?: GetSmartEdgeOptions;
  nodes: Node<NodeDataType>[];
};

export interface GetSmartEdgeReturn {
  svgPathString: string;
  edgeCenterX: number;
  edgeCenterY: number;
  /**
   * The sequence of graph-coordinate points that make up the routed path
   * (after endpoint alignment), excluding the source/target handle points.
   * Used by waypoint routing to stitch multiple segments into a single edge.
   */
  points: number[][];
}

export const getSmartEdge = <
  NodeDataType extends Record<string, unknown> = Record<string, unknown>,
>({
  options = {},
  nodes,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: GetSmartEdgeParams<NodeDataType>): GetSmartEdgeReturn | Error => {
  try {
    const {
      drawEdge = svgDrawSmoothLinePath,
      generatePath = pathfindingAStarDiagonal,
      avoidAreas = [],
    } = options;

    let { gridRatio = 10, nodePadding = 10 } = options;
    gridRatio = toInteger(gridRatio);
    nodePadding = toInteger(nodePadding);

    // We use the node's information (plus any consumer-provided avoid areas) to
    // generate bounding boxes for them and the graph. The source/target points
    // are included so the grid always covers them, even when an endpoint (e.g.
    // a dragged waypoint) sits beyond every node.
    const { graphBox, nodeBoxes, avoidBoxes } = getBoundingBoxes(
      nodes,
      nodePadding,
      gridRatio,
      avoidAreas,
      [
        { x: sourceX, y: sourceY },
        { x: targetX, y: targetY },
      ],
    );

    const source: PointInfo = {
      x: sourceX,
      y: sourceY,
      position: sourcePosition,
    };

    const target: PointInfo = {
      x: targetX,
      y: targetY,
      position: targetPosition,
    };

    // With this information, we can create a 2D grid representation of
    // our graph, that tells us where in the graph there is a "free" space or not
    const { grid, start, end } = createGrid(
      graphBox,
      [...nodeBoxes, ...avoidBoxes],
      source,
      target,
      gridRatio,
    );

    // We then can use the grid representation to do pathfinding
    const generatePathResult = generatePath(grid, start, end);

    const fullPath = generatePathResult;

    // Here we convert the grid path to a sequence of graph coordinates.
    const graphPath = fullPath.map((gridPoint) => {
      const [posX, posY] = gridPoint;
      const graphPoint = gridToGraphPoint(
        { x: posX, y: posY },
        graphBox.xMin,
        graphBox.yMin,
        gridRatio,
      );
      return [graphPoint.x, graphPoint.y];
    });

    // Insert orthogonal alignment waypoints between the actual handle
    // coordinates and the grid-snapped path, so edges leave/enter their nodes
    // perpendicular to the handle instead of taking a small diagonal toward
    // the first/last grid cell.
    const alignedPath = alignEndpoints(source, target, graphPath);

    // Finally, we can use the graph path to draw the edge
    const svgPathString = drawEdge(source, target, alignedPath);

    // Compute the edge's middle point using the full path, so users can use
    // it to position their custom labels
    const index = Math.floor(fullPath.length / 2);
    const middlePoint = fullPath[index];
    const [middleX, middleY] = middlePoint;
    const { x: edgeCenterX, y: edgeCenterY } = gridToGraphPoint(
      { x: middleX, y: middleY },
      graphBox.xMin,
      graphBox.yMin,
      gridRatio,
    );

    return { svgPathString, edgeCenterX, edgeCenterY, points: alignedPath };
  } catch (error) {
    if (error instanceof Error) {
      return error;
    } else {
      return new Error(`Unknown error: ${String(error)}`);
    }
  }
};

export type GetSmartEdgeFunction = typeof getSmartEdge;
