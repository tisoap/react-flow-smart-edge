import {
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
  SVGDrawFunction,
} from "../functions";
import type { Node, EdgeProps } from "@xyflow/react";

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
  drawEdge?: SVGDrawFunction;
  generatePath?: PathFindingFunction;
  // Internal-only debug hook. Not intended for public consumption.
  debug?: {
    enabled?: boolean;
    setGraphBox?: (box: {
      x: number;
      y: number;
      width: number;
      height: number;
    }) => void;
  };
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
    } = options;

    let { gridRatio = 10, nodePadding = 10 } = options;
    gridRatio = toInteger(gridRatio);
    nodePadding = toInteger(nodePadding);

    // We use the node's information to generate bounding boxes for them
    // and the graph
    const { graphBox, nodeBoxes } = getBoundingBoxes(
      nodes,
      nodePadding,
      gridRatio,
    );

    // Internal: publish computed bounding box for debugging visualization
    if (options.debug?.enabled && options.debug.setGraphBox) {
      options.debug.setGraphBox({
        x: graphBox.topLeft.x,
        y: graphBox.topLeft.y,
        width: graphBox.width,
        height: graphBox.height,
      });
    }

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
      nodeBoxes,
      source,
      target,
      gridRatio,
    );

    // We then can use the grid representation to do pathfinding
    const generatePathResult = generatePath(grid, start, end);

    const fullPath = generatePathResult;

    // Here we convert the grid path to a sequence of graph coordinates.
    const graphPath = fullPath.map((gridPoint) => {
      const [x, y] = gridPoint;
      const graphPoint = gridToGraphPoint(
        { x, y },
        graphBox.xMin,
        graphBox.yMin,
        gridRatio,
      );
      return [graphPoint.x, graphPoint.y];
    });

    // Finally, we can use the graph path to draw the edge
    const svgPathString = drawEdge(source, target, graphPath);

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

    return { svgPathString, edgeCenterX, edgeCenterY };
  } catch (error) {
    if (error instanceof Error) {
      return error;
    } else {
      return new Error(`Unknown error: ${String(error)}`);
    }
  }
};

export type GetSmartEdgeFunction = typeof getSmartEdge;
