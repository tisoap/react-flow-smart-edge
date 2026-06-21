import { createAStarFinder } from "../pathfinding/aStar";
import { createJumpPointFinder } from "../pathfinding/jumpPoint";
import type { Grid } from "../pathfinding/grid";
import type { XYPosition } from "@xyflow/react";

/**
 * Takes source and target {x, y} points, together with an grid representation
 * of the graph, and returns an array of number tuples [x, y], representing
 * the full path from source to target.
 */
export type PathFindingFunction = (
  grid: Grid,
  start: XYPosition,
  end: XYPosition,
) => number[][];

const NO_PATH_FOUND_ERROR = "No path found";

const rethrowPathfindingError = (error: unknown): never => {
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(`Unknown error: ${String(error)}`, { cause: error });
};

export const pathfindingAStarDiagonal: PathFindingFunction = (
  grid,
  start,
  end,
) => {
  try {
    const finder = createAStarFinder({
      diagonalMovement: "Always",
    });
    const fullPath = finder.findPath(start.x, start.y, end.x, end.y, grid);

    if (fullPath.length === 0) {
      throw new Error(NO_PATH_FOUND_ERROR);
    }
    return fullPath;
  } catch (error) {
    return rethrowPathfindingError(error);
  }
};

export const pathfindingAStarNoDiagonal: PathFindingFunction = (
  grid,
  start,
  end,
) => {
  try {
    const finder = createAStarFinder({
      diagonalMovement: "Never",
    });
    const fullPath = finder.findPath(start.x, start.y, end.x, end.y, grid);

    if (fullPath.length === 0) {
      throw new Error(NO_PATH_FOUND_ERROR);
    }
    return fullPath;
  } catch (error) {
    return rethrowPathfindingError(error);
  }
};

export const pathfindingJumpPointNoDiagonal: PathFindingFunction = (
  grid,
  start,
  end,
) => {
  try {
    const finder = createJumpPointFinder();
    const jumpPointPath = finder.findPath(start.x, start.y, end.x, end.y, grid);

    if (jumpPointPath.length === 0) {
      throw new Error(NO_PATH_FOUND_ERROR);
    }
    return jumpPointPath;
  } catch (error) {
    return rethrowPathfindingError(error);
  }
};
