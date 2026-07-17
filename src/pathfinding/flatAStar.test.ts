import { describe, expect, it } from "vitest";
import { blockCellRange, createFlatGrid } from "./flatGrid";
import { findPathAStar } from "./flatAStar";

describe("findPathAStar", () => {
  it("finds a straight orthogonal path on an empty grid", () => {
    const grid = createFlatGrid(5, 5);
    const path = findPathAStar(grid, 0, 2, 4, 2, false);
    expect(path[0]).toEqual([0, 2]);
    expect(path[path.length - 1]).toEqual([4, 2]);
    expect(path).toHaveLength(5);
  });

  it("routes around an obstacle wall", () => {
    const grid = createFlatGrid(5, 5);
    blockCellRange(grid, 2, 0, 3, 4); // wall at x=2, y=0..3 (gap at y=4)
    const path = findPathAStar(grid, 0, 0, 4, 0, false);
    expect(path.length).toBeGreaterThan(0);
    expect(path.some(([column, row]) => column === 2 && row === 4)).toBe(true);
    // never steps on a blocked cell
    expect(path.every(([column, row]) => !(column === 2 && row < 4))).toBe(
      true,
    );
  });

  it("returns an empty path when fully walled off", () => {
    const grid = createFlatGrid(5, 5);
    blockCellRange(grid, 2, 0, 3, 5);
    expect(findPathAStar(grid, 0, 0, 4, 0, false)).toEqual([]);
  });

  it("uses diagonal steps when allowed", () => {
    const grid = createFlatGrid(5, 5);
    const path = findPathAStar(grid, 0, 0, 4, 4, true);
    expect(path).toHaveLength(5); // pure diagonal
    expect(path[1]).toEqual([1, 1]);
  });

  it("start equals end returns the single cell", () => {
    const grid = createFlatGrid(3, 3);
    expect(findPathAStar(grid, 1, 1, 1, 1, false)).toEqual([[1, 1]]);
  });

  it("returns empty when start or end is blocked", () => {
    const grid = createFlatGrid(3, 3);
    blockCellRange(grid, 0, 0, 1, 1);
    expect(findPathAStar(grid, 0, 0, 2, 2, false)).toEqual([]);
  });

  it("skips stale duplicate heap entries when a node is re-relaxed before pop", () => {
    // The binary heap has no decrease-key: relaxing an already-open node pushes
    // a second entry instead of updating the first. A wall at x=3 (rows 0..4,
    // gap only at row 5) forces two converging diagonal routes toward the
    // bottom-right gap. One route reaches a shared cell first with a worse g,
    // then the other reaches the same cell with a better g before the first
    // entry is ever popped, leaving a stale higher-cost duplicate in the heap
    // that must be skipped once the cell is already closed.
    const grid = createFlatGrid(6, 6);
    blockCellRange(grid, 3, 0, 4, 5);
    const path = findPathAStar(grid, 0, 0, 5, 5, true);
    expect(path[0]).toEqual([0, 0]);
    expect(path[path.length - 1]).toEqual([5, 5]);
    expect(path.length).toBeGreaterThan(0);
  });
});
