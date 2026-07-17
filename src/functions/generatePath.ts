import { findPathAStar } from "../pathfinding/flatAStar";
import { findPathJumpPoint } from "../pathfinding/flatJumpPoint";
import type { FlatGrid } from "../pathfinding/flatGrid";
import type { XYPosition } from "@xyflow/react";

/**
 * Takes source and target {x, y} points, together with a flat grid
 * representation of the graph, and returns an array of number tuples [x, y],
 * representing the full path from source to target.
 */
export type PathFindingFunction = (
  grid: FlatGrid,
  start: XYPosition,
  end: XYPosition,
) => number[][];

export const NO_PATH_FOUND_ERROR = "No path found";

export const pathfindingAStarDiagonal: PathFindingFunction = (
  grid,
  start,
  end,
) => {
  const fullPath = findPathAStar(grid, start.x, start.y, end.x, end.y, true);
  if (fullPath.length === 0) {
    throw new Error(NO_PATH_FOUND_ERROR);
  }
  return fullPath;
};

export const pathfindingAStarNoDiagonal: PathFindingFunction = (
  grid,
  start,
  end,
) => {
  const fullPath = findPathAStar(grid, start.x, start.y, end.x, end.y, false);
  if (fullPath.length === 0) {
    throw new Error(NO_PATH_FOUND_ERROR);
  }
  return fullPath;
};

export const pathfindingJumpPointNoDiagonal: PathFindingFunction = (
  grid,
  start,
  end,
) => {
  const jumpPointPath = findPathJumpPoint(grid, start.x, start.y, end.x, end.y);
  if (jumpPointPath.length === 0) {
    throw new Error(NO_PATH_FOUND_ERROR);
  }
  return jumpPointPath;
};
