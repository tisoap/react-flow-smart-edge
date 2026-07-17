import { describe, expect, it } from "vitest";
import {
  blockCellRange,
  cloneFlatGrid,
  createFlatGrid,
  isInside,
  isWalkable,
  setBlocked,
} from "./flatGrid";

describe("flatGrid", () => {
  it("creates an all-walkable grid", () => {
    const grid = createFlatGrid(3, 2);
    expect(grid.width).toBe(3);
    expect(grid.height).toBe(2);
    expect(isWalkable(grid, 0, 0)).toBe(true);
    expect(isWalkable(grid, 2, 1)).toBe(true);
  });

  it("treats out-of-bounds as not walkable and not inside", () => {
    const grid = createFlatGrid(2, 2);
    expect(isInside(grid, -1, 0)).toBe(false);
    expect(isInside(grid, 0, 2)).toBe(false);
    expect(isWalkable(grid, 2, 0)).toBe(false);
  });

  it("sets and clears blocked cells, ignoring out-of-bounds writes", () => {
    const grid = createFlatGrid(2, 2);
    setBlocked(grid, 1, 1, true);
    expect(isWalkable(grid, 1, 1)).toBe(false);
    setBlocked(grid, 1, 1, false);
    expect(isWalkable(grid, 1, 1)).toBe(true);
    setBlocked(grid, 5, 5, true); // must not throw
  });

  it("blocks a clamped cell range", () => {
    const grid = createFlatGrid(4, 4);
    blockCellRange(grid, 1, 1, 3, 6); // rowEnd clamps to 4
    expect(isWalkable(grid, 1, 1)).toBe(false);
    expect(isWalkable(grid, 2, 3)).toBe(false);
    expect(isWalkable(grid, 3, 1)).toBe(true); // columnEnd exclusive
    expect(isWalkable(grid, 0, 0)).toBe(true);
  });

  it("clones without sharing the blocked buffer", () => {
    const grid = createFlatGrid(2, 2);
    const copy = cloneFlatGrid(grid);
    setBlocked(copy, 0, 0, true);
    expect(isWalkable(grid, 0, 0)).toBe(true);
    expect(isWalkable(copy, 0, 0)).toBe(false);
  });
});
