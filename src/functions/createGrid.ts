import { createGrid as createLocalGrid } from "../pathfinding/grid";
import type { Grid } from "../pathfinding/grid";
import {
  guaranteeWalkablePath,
  getNextPointFromPosition,
} from "./guaranteeWalkablePath";
import { graphToGridPoint } from "./pointConversion";
import { round, roundUp } from "./utils";
import type { NodeBoundingBox, GraphBoundingBox } from "./getBoundingBoxes";
import type { Position } from "@xyflow/react";

export interface PointInfo {
  x: number;
  y: number;
  position: Position;
}

/** Grid dimensions (in cells) derived from the graph box and grid ratio. */
const getGridDimensions = (graph: GraphBoundingBox, gridRatio: number) => ({
  mapColumns: roundUp(graph.width, gridRatio) / gridRatio + 1,
  mapRows: roundUp(graph.height, gridRatio) / gridRatio + 1,
});

/**
 * Visit every grid cell occupied by a node bounding box. Shared by the live
 * grid marking and the cacheable obstacle matrix so both stay in sync.
 */
const forEachNodeCell = (
  nodes: NodeBoundingBox[],
  xMin: number,
  yMin: number,
  gridRatio: number,
  visit: (column: number, row: number) => void,
) => {
  nodes.forEach((node) => {
    const nodeStart = graphToGridPoint(node.topLeft, xMin, yMin, gridRatio);
    const nodeEnd = graphToGridPoint(node.bottomRight, xMin, yMin, gridRatio);

    for (let column = nodeStart.x; column < nodeEnd.x; column++) {
      for (let row = nodeStart.y; row < nodeEnd.y; row++) {
        visit(column, row);
      }
    }
  });
};

/**
 * Build the obstacle matrix for a graph box: a `mapRows x mapColumns` grid
 * where `1` marks a cell covered by a node and `0` marks free space. This is
 * the endpoint-independent part of {@link createGrid}, so it can be computed
 * once per frame and reused across every edge that shares the same nodes and
 * options (see `getSmartEdge`'s shared grid cache).
 */
export const buildObstacleMatrix = (
  graph: GraphBoundingBox,
  nodes: NodeBoundingBox[],
  gridRatio: number,
): number[][] => {
  const { xMin, yMin } = graph;
  const { mapColumns, mapRows } = getGridDimensions(graph, gridRatio);

  const matrix: number[][] = Array.from({ length: mapRows }, () =>
    Array.from<number>({ length: mapColumns }).fill(0),
  );

  forEachNodeCell(nodes, xMin, yMin, gridRatio, (column, row) => {
    // Match `Grid.setWalkableAt`, which silently ignores out-of-bounds cells.
    if (column >= 0 && column < mapColumns && row >= 0 && row < mapRows) {
      matrix[row][column] = 1;
    }
  });

  return matrix;
};

export const createGrid = (
  graph: GraphBoundingBox,
  nodes: NodeBoundingBox[],
  source: PointInfo,
  target: PointInfo,
  gridRatio = 2,
  obstacleMatrix?: number[][],
) => {
  const { xMin, yMin } = graph;
  const { mapColumns, mapRows } = getGridDimensions(graph, gridRatio);

  // Create a grid representation of the graph box, where each cell is
  // equivalent to 10x10 pixels (or the grid ratio) on the graph. We'll use
  // this simplified grid to do pathfinding. When a precomputed obstacle matrix
  // is supplied (shared across edges in the same frame) we reuse it instead of
  // re-marking every node; otherwise we build it from the node boxes here.
  const matrix = obstacleMatrix ?? buildObstacleMatrix(graph, nodes, gridRatio);
  const grid: Grid = createLocalGrid(mapColumns, mapRows, matrix);

  // Convert the starting and ending graph points to grid points
  const startGrid = graphToGridPoint(
    {
      x: round(source.x, gridRatio),
      y: round(source.y, gridRatio),
    },
    xMin,
    yMin,
    gridRatio,
  );

  const endGrid = graphToGridPoint(
    {
      x: round(target.x, gridRatio),
      y: round(target.y, gridRatio),
    },
    xMin,
    yMin,
    gridRatio,
  );

  // Guarantee a walkable path between the start and end points, even if the
  // source or target where covered by another node or by padding
  const startingNode = grid.getNodeAt(startGrid.x, startGrid.y);
  guaranteeWalkablePath(grid, startingNode, source.position);

  const endingNode = grid.getNodeAt(endGrid.x, endGrid.y);
  guaranteeWalkablePath(grid, endingNode, target.position);

  // Use the next closest points as the start and end points, so
  // pathfinding does not start too close to the nodes
  const start = getNextPointFromPosition(startingNode, source.position);
  const end = getNextPointFromPosition(endingNode, target.position);

  return { grid, start, end };
};
