import { AStarFinder, Util, DiagonalMovement } from 'pathfinding';
import type { Grid } from 'pathfinding';
import type { XYPosition } from 'react-flow-renderer';

// https://www.npmjs.com/package/pathfinding#advanced-usage
declare module 'pathfinding' {
  interface FinderOptions extends Heuristic {
    diagonalMovement?: DiagonalMovement;
    weight?: number;
    allowDiagonal?: boolean;
    dontCrossCorners?: boolean;
  }
}

export const generatePath = (
  grid: Grid,
  start: XYPosition,
  end: XYPosition
) => {
  const finder = new AStarFinder({
    diagonalMovement: DiagonalMovement.Always,
    allowDiagonal: true,
    dontCrossCorners: true,
  });

  let fullPath: number[][] = [];
  let smoothedPath: number[][] = [];

  try {
    fullPath = finder.findPath(start.x, start.y, end.x, end.y, grid);
    smoothedPath = Util.smoothenPath(grid, fullPath);
  } catch {
    // No path was found. This can happen if the end point is "surrounded"
    // by other nodes, or if the starting and ending nodes are on top of
    // each other.
  }

  return { fullPath, smoothedPath };
};
