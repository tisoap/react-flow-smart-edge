/**
 * Flat typed-array obstacle grid: the v5 replacement for the object-based
 * PathFinding.js grid. One byte per cell, indexed `y * width + x`, so building
 * and cloning are single allocations and pathfinding touches no heap objects.
 */
export interface FlatGrid {
  width: number;
  height: number;
  /** `1` = blocked, `0` = walkable; index = `y * width + x`. */
  blocked: Uint8Array;
}

export const createFlatGrid = (width: number, height: number): FlatGrid => ({
  width,
  height,
  blocked: new Uint8Array(width * height),
});

export const cloneFlatGrid = (grid: FlatGrid): FlatGrid => ({
  width: grid.width,
  height: grid.height,
  blocked: grid.blocked.slice(),
});

export const isInside = (
  grid: FlatGrid,
  column: number,
  row: number,
): boolean =>
  column >= 0 && column < grid.width && row >= 0 && row < grid.height;

export const isWalkable = (
  grid: FlatGrid,
  column: number,
  row: number,
): boolean =>
  isInside(grid, column, row) && grid.blocked[row * grid.width + column] === 0;

/** Out-of-bounds writes are silently ignored, like the old `setWalkableAt`. */
export const setBlocked = (
  grid: FlatGrid,
  column: number,
  row: number,
  blocked: boolean,
): void => {
  if (!isInside(grid, column, row)) return;
  grid.blocked[row * grid.width + column] = blocked ? 1 : 0;
};

/** Blocks every cell in `[columnStart, columnEnd) × [rowStart, rowEnd)`, clamped to bounds. */
export const blockCellRange = (
  grid: FlatGrid,
  columnStart: number,
  rowStart: number,
  columnEnd: number,
  rowEnd: number,
): void => {
  const minColumn = Math.max(0, columnStart);
  const minRow = Math.max(0, rowStart);
  const maxColumn = Math.min(grid.width, columnEnd);
  const maxRow = Math.min(grid.height, rowEnd);
  for (let row = minRow; row < maxRow; row++) {
    const rowOffset = row * grid.width;
    grid.blocked.fill(1, rowOffset + minColumn, rowOffset + maxColumn);
  }
};
