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

// eslint-disable-next-line id-length -- x,y are standard grid coordinate names
export const isInside = (grid: FlatGrid, x: number, y: number): boolean =>
  x >= 0 && x < grid.width && y >= 0 && y < grid.height;

// eslint-disable-next-line id-length -- x,y are standard grid coordinate names
export const isWalkable = (grid: FlatGrid, x: number, y: number): boolean =>
  isInside(grid, x, y) && grid.blocked[y * grid.width + x] === 0;

/** Out-of-bounds writes are silently ignored, like the old `setWalkableAt`. */
export const setBlocked = (
  grid: FlatGrid,
  // eslint-disable-next-line id-length -- x,y are standard grid coordinate names
  x: number,
  // eslint-disable-next-line id-length -- x,y are standard grid coordinate names
  y: number,
  blocked: boolean,
): void => {
  if (!isInside(grid, x, y)) return;
  grid.blocked[y * grid.width + x] = blocked ? 1 : 0;
};

/** Blocks every cell in `[xStart, xEnd) × [yStart, yEnd)`, clamped to bounds. */
export const blockCellRange = (
  grid: FlatGrid,
  xStart: number,
  yStart: number,
  xEnd: number,
  yEnd: number,
): void => {
  // eslint-disable-next-line id-length -- x0,y0,x1,y1 are standard clamped boundary names
  const x0 = Math.max(0, xStart);
  // eslint-disable-next-line id-length -- x0,y0,x1,y1 are standard clamped boundary names
  const y0 = Math.max(0, yStart);
  // eslint-disable-next-line id-length -- x0,y0,x1,y1 are standard clamped boundary names
  const x1 = Math.min(grid.width, xEnd);
  // eslint-disable-next-line id-length -- x0,y0,x1,y1 are standard clamped boundary names
  const y1 = Math.min(grid.height, yEnd);
  // eslint-disable-next-line id-length -- y is a standard loop variable for grid row iteration
  for (let y = y0; y < y1; y++) {
    const rowOffset = y * grid.width;
    grid.blocked.fill(1, rowOffset + x0, rowOffset + x1);
  }
};
