// Bench-only glue: builds the legacy v4 object-grid pipeline (bench/legacy/)
// from the same `getBoundingBoxes` output the v5 engine uses, and applies the
// same walkability guarantee, so a legacy finder and a v5 flat-grid finder
// always search the same obstacle layout from the same start/end cell. This
// isolates "which finder is faster" from "are the inputs actually
// equivalent" when comparing engine.bench.ts's A/B groups.
import {
  buildBaseGrid,
  getBoundingBoxes,
  getNextPointFromPosition,
  graphToGridPoint,
  guaranteeWalkablePath,
  round,
  roundUp,
} from "../src/functions";
import { createGrid as createLegacyGrid } from "./legacy/grid";
import type {
  Direction,
  GraphBoundingBox,
  NodeBoundingBox,
  PointInfo,
} from "../src/functions";
import type { FlatGrid } from "../src/pathfinding/flatGrid";
import type { Grid as LegacyGrid } from "./legacy/grid";
import type { Node, XYPosition } from "@xyflow/react";

/**
 * Rasterizes `nodeBoxes` onto a legacy PathFinding.js-style matrix, then
 * builds the legacy `Grid` from it. Mirrors `buildBaseGrid`'s cell-marking
 * loop exactly (same box corners, same grid-ratio math) but targets the v4
 * object-based `Grid` instead of the v5 `FlatGrid`.
 */
export const buildLegacyGridFromBoxes = (
  graphBox: GraphBoundingBox,
  nodeBoxes: NodeBoundingBox[],
  gridRatio: number,
): LegacyGrid => {
  const { xMin, yMin } = graphBox;
  const mapColumns = roundUp(graphBox.width, gridRatio) / gridRatio + 1;
  const mapRows = roundUp(graphBox.height, gridRatio) / gridRatio + 1;
  const matrix: number[][] = Array.from({ length: mapRows }, () =>
    Array.from<number>({ length: mapColumns }).fill(0),
  );

  nodeBoxes.forEach((node) => {
    const nodeStart = graphToGridPoint(node.topLeft, xMin, yMin, gridRatio);
    const nodeEnd = graphToGridPoint(node.bottomRight, xMin, yMin, gridRatio);
    for (let column = nodeStart.x; column < nodeEnd.x; column++) {
      for (let row = nodeStart.y; row < nodeEnd.y; row++) {
        matrix[row][column] = 1;
      }
    }
  });

  return createLegacyGrid(mapColumns, mapRows, matrix);
};

/** Legacy-`Grid`-shaped twin of `guaranteeWalkablePath`, reusing the same
 * pure position-stepping helper so both engines carve an identical lane
 * out from the handle point. */
const guaranteeWalkablePathLegacy = (
  grid: LegacyGrid,
  point: XYPosition,
  position: Direction,
): void => {
  let current = { x: point.x, y: point.y };
  while (
    grid.isInside(current.x, current.y) &&
    !grid.isWalkableAt(current.x, current.y)
  ) {
    grid.setWalkableAt(current.x, current.y, true);
    current = getNextPointFromPosition(current, position);
  }
};

export interface RouteSetup {
  /** The v5 flat grid, pre-guaranteed walkable at `start`/`end`. Safe to
   * reuse across repeated searches: `findPathAStar`/`findPathJumpPoint`
   * never mutate the grid itself. */
  flatGrid: FlatGrid;
  /** The legacy object grid, pre-guaranteed walkable at `start`/`end`. Must
   * be `.clone()`d before each search — legacy finders mutate node state
   * (`opened`/`closed`/`parent`) in place. */
  legacyGrid: LegacyGrid;
  start: XYPosition;
  end: XYPosition;
}

/**
 * Builds the full-graph (no corridor) obstacle layout for one routed edge in
 * both grid representations, ready for a legacy and a flat-grid finder to
 * search over identical obstacles from identical start/end cells.
 */
export const buildRouteSetup = (
  nodes: Node[],
  source: PointInfo,
  target: PointInfo,
  nodePadding: number,
  gridRatio: number,
): RouteSetup => {
  const { graphBox, nodeBoxes } = getBoundingBoxes(
    nodes,
    nodePadding,
    gridRatio,
    [],
    [
      { x: source.x, y: source.y },
      { x: target.x, y: target.y },
    ],
  );

  const flatGrid = buildBaseGrid(graphBox, nodeBoxes, gridRatio);
  const legacyGrid = buildLegacyGridFromBoxes(graphBox, nodeBoxes, gridRatio);

  const startGrid = graphToGridPoint(
    { x: round(source.x, gridRatio), y: round(source.y, gridRatio) },
    graphBox.xMin,
    graphBox.yMin,
    gridRatio,
  );
  const endGrid = graphToGridPoint(
    { x: round(target.x, gridRatio), y: round(target.y, gridRatio) },
    graphBox.xMin,
    graphBox.yMin,
    gridRatio,
  );

  guaranteeWalkablePath(flatGrid, startGrid, source.position);
  guaranteeWalkablePath(flatGrid, endGrid, target.position);
  guaranteeWalkablePathLegacy(legacyGrid, startGrid, source.position);
  guaranteeWalkablePathLegacy(legacyGrid, endGrid, target.position);

  const start = getNextPointFromPosition(startGrid, source.position);
  const end = getNextPointFromPosition(endGrid, target.position);

  return { flatGrid, legacyGrid, start, end };
};
