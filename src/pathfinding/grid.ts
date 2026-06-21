// Based on https://github.com/qiao/PathFinding.js
import type { DiagonalMovement } from "./types.ts";

// A modern, typed, functional replacement for PathFinding.js Grid
// Provides the same runtime API shape used by finders/utilities:
// - width, height, nodes[][]
// - getNodeAt, isWalkableAt, setWalkableAt, getNeighbors, clone

export interface GridNode {
  x: number;
  y: number;
  walkable: boolean;
  // A* search metadata (set during pathfinding)
  costFromStart?: number;
  heuristicCostToGoal?: number;
  estimatedTotalCost?: number;
  opened?: boolean;
  closed?: boolean;
  parent?: GridNode;
}

export interface Grid {
  width: number;
  height: number;
  nodes: GridNode[][]; // nodes[row][col] i.e., nodes[y][x]

  getNodeAt: (x: number, y: number) => GridNode;
  isWalkableAt: (x: number, y: number) => boolean;
  setWalkableAt: (x: number, y: number, walkable: boolean) => void;
  getNeighbors: (
    node: GridNode,
    diagonalMovement: DiagonalMovement,
  ) => GridNode[];
  isInside: (x: number, y: number) => boolean;
  clone: () => Grid;
}

const createNodes = (
  width: number,
  height: number,
  matrix?: (number | boolean)[][],
): GridNode[][] => {
  const rows: GridNode[][] = new Array<GridNode[]>(height);
  for (let row = 0; row < height; row++) {
    const gridRow: GridNode[] = new Array<GridNode>(width);
    for (let column = 0; column < width; column++) {
      // PathFinding.js semantics: a truthy matrix cell means non-walkable
      // (e.g., 1 indicates obstacle). Falsy (0) means walkable.
      const cell = matrix ? matrix[row]?.[column] : undefined;
      const isBlocked = !!cell;
      const walkable = matrix ? !isBlocked : true;
      gridRow[column] = { x: column, y: row, walkable };
    }
    rows[row] = gridRow;
  }
  return rows;
};

const withinBounds = (
  width: number,
  height: number,
  column: number,
  row: number,
) => column >= 0 && column < width && row >= 0 && row < height;

/**
 * Create a grid with the given width/height. Optionally accepts a matrix
 * of booleans/numbers indicating obstacles (truthy = blocked, falsy/0 = walkable).
 */
export const createGrid = (
  width: number,
  height: number,
  matrix?: (number | boolean)[][],
): Grid => {
  const nodes = createNodes(width, height, matrix);

  const getNodeAt = (column: number, row: number): GridNode =>
    nodes[row][column];

  const isWalkableAt = (column: number, row: number): boolean =>
    withinBounds(width, height, column, row) && nodes[row][column].walkable;

  const setWalkableAt = (
    column: number,
    row: number,
    walkable: boolean,
  ): void => {
    if (!withinBounds(width, height, column, row)) return;
    nodes[row][column].walkable = walkable;
  };

  // Diagonal movement policy using string literal union values:
  // "Always", "Never", "IfAtMostOneObstacle", "OnlyWhenNoObstacles"
  const getNeighbors = (
    node: GridNode,
    diagonalMovement: import("./types.ts").DiagonalMovement,
  ): GridNode[] => {
    const column = node.x;
    const row = node.y;
    const neighbors: GridNode[] = [];

    // ↑, →, ↓, ←
    const canWalkNorth = isWalkableAt(column, row - 1);
    const canWalkEast = isWalkableAt(column + 1, row);
    const canWalkSouth = isWalkableAt(column, row + 1);
    const canWalkWest = isWalkableAt(column - 1, row);

    if (canWalkNorth) neighbors.push(getNodeAt(column, row - 1));
    if (canWalkEast) neighbors.push(getNodeAt(column + 1, row));
    if (canWalkSouth) neighbors.push(getNodeAt(column, row + 1));
    if (canWalkWest) neighbors.push(getNodeAt(column - 1, row));

    // Diagonals: ↗, ↘, ↙, ↖
    const northEastWalkable = isWalkableAt(column + 1, row - 1);
    const southEastWalkable = isWalkableAt(column + 1, row + 1);
    const southWestWalkable = isWalkableAt(column - 1, row + 1);
    const northWestWalkable = isWalkableAt(column - 1, row - 1);

    if (diagonalMovement === "Never") {
      return neighbors;
    }

    // default: "Always"
    if (northEastWalkable) neighbors.push(getNodeAt(column + 1, row - 1));
    if (southEastWalkable) neighbors.push(getNodeAt(column + 1, row + 1));
    if (southWestWalkable) neighbors.push(getNodeAt(column - 1, row + 1));
    if (northWestWalkable) neighbors.push(getNodeAt(column - 1, row - 1));
    return neighbors;
  };

  const clone = (): Grid => {
    // Recreate the original matrix semantics: truthy = blocked
    const clonedMatrix: number[][] = nodes.map((gridRow) =>
      gridRow.map((node) => (node.walkable ? 0 : 1)),
    );
    return createGrid(width, height, clonedMatrix);
  };

  return {
    width,
    height,
    nodes,
    getNodeAt,
    isWalkableAt,
    setWalkableAt,
    getNeighbors,
    isInside: (column: number, row: number) =>
      withinBounds(width, height, column, row),
    clone,
  };
};
