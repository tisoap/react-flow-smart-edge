// Bench-only glue: builds a v5 flat-grid route setup (grid + walkable
// start/end cells) from the same `getBoundingBoxes` output `getSmartEdge`
// uses, so `engine.bench.ts`'s A* and JPS benches search a realistic
// obstacle layout instead of hand-rolled grids.
import {
  buildBaseGrid,
  getBoundingBoxes,
  getNextPointFromPosition,
  graphToGridPoint,
  guaranteeWalkablePath,
  round,
} from "../src/functions";
import type { PointInfo } from "../src/functions";
import type { FlatGrid } from "../src/pathfinding/flatGrid";
import type { Node, XYPosition } from "@xyflow/react";

export interface RouteSetup {
  /** The v5 flat grid, pre-guaranteed walkable at `start`/`end`. Safe to
   * reuse across repeated searches: `findPathAStar`/`findPathJumpPoint`
   * never mutate the grid itself. */
  flatGrid: FlatGrid;
  start: XYPosition;
  end: XYPosition;
}

/**
 * Builds the full-graph obstacle layout for one routed edge as a v5 flat
 * grid, ready for `findPathAStar`/`findPathJumpPoint` to search over from
 * identical, pre-guaranteed-walkable start/end cells.
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

  const start = getNextPointFromPosition(startGrid, source.position);
  const end = getNextPointFromPosition(endGrid, target.position);

  return { flatGrid, start, end };
};
