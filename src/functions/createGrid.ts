import {
  createFlatGrid,
  cloneFlatGrid,
  setBlocked,
} from "../pathfinding/flatGrid";
import type { FlatGrid } from "../pathfinding/flatGrid";
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
 * grid marking and the cacheable base grid so both stay in sync.
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
 * Build the base obstacle grid for a graph box: a flat `mapColumns x mapRows`
 * grid where every cell covered by a node is blocked and every other cell is
 * walkable. This is the endpoint-independent part of {@link createGrid}, so it
 * can be computed once per frame and reused across every edge that shares the
 * same nodes and options (see `getSmartEdge`'s shared grid cache).
 */
export const buildBaseGrid = (
  graph: GraphBoundingBox,
  nodes: NodeBoundingBox[],
  gridRatio: number,
): FlatGrid => {
  const { xMin, yMin } = graph;
  const { mapColumns, mapRows } = getGridDimensions(graph, gridRatio);

  const grid = createFlatGrid(mapColumns, mapRows);

  // `setBlocked` silently ignores out-of-bounds cells, matching the old
  // `Grid.setWalkableAt` semantics.
  forEachNodeCell(nodes, xMin, yMin, gridRatio, (column, row) => {
    setBlocked(grid, column, row, true);
  });

  return grid;
};

export const createGrid = (
  graph: GraphBoundingBox,
  nodes: NodeBoundingBox[],
  source: PointInfo,
  target: PointInfo,
  gridRatio = 2,
  baseGrid?: FlatGrid,
) => {
  const { xMin, yMin } = graph;

  // Create a grid representation of the graph box, where each cell is
  // equivalent to 10x10 pixels (or the grid ratio) on the graph. We'll use
  // this simplified grid to do pathfinding. When a precomputed base grid is
  // supplied (shared across edges in the same frame) we clone it instead of
  // re-marking every node; otherwise we build it from the node boxes here.
  const grid = baseGrid
    ? cloneFlatGrid(baseGrid)
    : buildBaseGrid(graph, nodes, gridRatio);

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
  guaranteeWalkablePath(grid, startGrid, source.position);
  guaranteeWalkablePath(grid, endGrid, target.position);

  // Use the next closest points as the start and end points, so
  // pathfinding does not start too close to the nodes
  const start = getNextPointFromPosition(startGrid, source.position);
  const end = getNextPointFromPosition(endGrid, target.position);

  return { grid, start, end };
};
