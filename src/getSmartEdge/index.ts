import {
  alignEndpoints,
  createGrid,
  getBoundingBoxes,
  gridToGraphPoint,
  pathfindingAStarDiagonal,
  svgDrawSmoothLinePath,
  toInteger,
  NO_PATH_FOUND_ERROR,
} from "../functions";
import type {
  PointInfo,
  PathFindingFunction,
  DrawEdgeFunction,
  GraphBoundingBox,
  NodeBoundingBox,
} from "../functions";
import {
  CORRIDOR_MARGIN_CELLS,
  buildCorridorAttempt,
} from "../routing/corridor";
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
  /**
   * Always `true` for a result produced by this synchronous routing pass.
   * The Web Worker batch-routing provider synthesizes placeholder results
   * with `wasRouted: false` while an edge's async route is still pending, so
   * consumers can tell a real path apart from a not-yet-routed stand-in.
   */
  wasRouted: true;
}

/** The output of one routing attempt: the grid geometry it ran on and the
 * raw grid-coordinate path `generatePath` returned. */
interface RouteAttempt {
  graphBox: GraphBoundingBox;
  fullPath: number[][];
}

/** Whether `error` is the "no path found" failure `generatePath` throws,
 * as opposed to some other error that should abort the retry ladder. */
const isNoPathFoundError = (error: unknown): boolean =>
  error instanceof Error && error.message === NO_PATH_FOUND_ERROR;

/** Builds a grid from a corridor (or full-graph) bounding-box result and
 * routes it, sharing the create-grid-then-generate-path shape across every
 * rung of the ladder and the final full-graph run. */
const routeOnBoxes = (
  graphBox: GraphBoundingBox,
  nodeBoxes: NodeBoundingBox[],
  avoidBoxes: NodeBoundingBox[],
  source: PointInfo,
  target: PointInfo,
  gridRatio: number,
  generatePath: PathFindingFunction,
): RouteAttempt => {
  const { grid, start, end } = createGrid(
    graphBox,
    [...nodeBoxes, ...avoidBoxes],
    source,
    target,
    gridRatio,
  );

  return { graphBox, fullPath: generatePath(grid, start, end) };
};

/** The final rung of the ladder: every node and avoid area, exactly like the
 * pre-corridor behavior (including `extraPoints` endpoint coverage). */
const routeFullGraph = (
  nodes: Node[],
  nodePadding: number,
  gridRatio: number,
  avoidAreas: Rect[],
  source: PointInfo,
  target: PointInfo,
  generatePath: PathFindingFunction,
): RouteAttempt => {
  const { graphBox, nodeBoxes, avoidBoxes } = getBoundingBoxes(
    nodes,
    nodePadding,
    gridRatio,
    avoidAreas,
    [
      { x: source.x, y: source.y },
      { x: target.x, y: target.y },
    ],
  );

  return routeOnBoxes(
    graphBox,
    nodeBoxes,
    avoidBoxes,
    source,
    target,
    gridRatio,
    generatePath,
  );
};

/**
 * Routes on a sub-grid cropped around the endpoints first, widening the
 * margin at each rung of `CORRIDOR_MARGIN_CELLS` and finally falling back to
 * the full graph, so routing cost stays proportional to the obstacle density
 * local to the edge instead of the whole canvas. A rung is retried only when
 * `generatePath` reports `NO_PATH_FOUND_ERROR`; any other thrown error aborts
 * the ladder immediately so the outer `try`/`catch` can surface it.
 */
const routeWithCorridorLadder = (
  nodes: Node[],
  nodePadding: number,
  gridRatio: number,
  avoidAreas: Rect[],
  source: PointInfo,
  target: PointInfo,
  generatePath: PathFindingFunction,
): RouteAttempt => {
  for (const marginCells of CORRIDOR_MARGIN_CELLS) {
    const { graphBox, nodeBoxes, avoidBoxes } = buildCorridorAttempt(
      source,
      target,
      nodes,
      nodePadding,
      gridRatio,
      avoidAreas,
      marginCells,
    );

    try {
      return routeOnBoxes(
        graphBox,
        nodeBoxes,
        avoidBoxes,
        source,
        target,
        gridRatio,
        generatePath,
      );
    } catch (error) {
      if (!isNoPathFoundError(error)) {
        throw error;
      }
    }
  }

  return routeFullGraph(
    nodes,
    nodePadding,
    gridRatio,
    avoidAreas,
    source,
    target,
    generatePath,
  );
};

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

    // Route on a small sub-grid cropped around the endpoints first, widening
    // the margin at each rung and finally falling back to the full graph, so
    // routing cost stays proportional to the obstacles local to this edge
    // instead of the whole canvas (see `routeWithCorridorLadder`).
    const { graphBox, fullPath } = routeWithCorridorLadder(
      nodes,
      nodePadding,
      gridRatio,
      avoidAreas,
      source,
      target,
      generatePath,
    );

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

    return {
      svgPathString,
      edgeCenterX,
      edgeCenterY,
      points: alignedPath,
      wasRouted: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      return error;
    } else {
      return new Error(`Unknown error: ${String(error)}`);
    }
  }
};

export type GetSmartEdgeFunction = typeof getSmartEdge;
