import { describe, expect, it } from "vitest";
import { blockCellRange, createFlatGrid } from "./flatGrid";
import { findPathJumpPoint } from "./flatJumpPoint";

describe("findPathJumpPoint", () => {
  it("finds a straight path on an empty grid", () => {
    const grid = createFlatGrid(6, 6);
    const path = findPathJumpPoint(grid, 0, 3, 5, 3);
    expect(path[0]).toEqual([0, 3]);
    expect(path[path.length - 1]).toEqual([5, 3]);
  });

  it("routes around an obstacle with orthogonal moves only", () => {
    const grid = createFlatGrid(7, 7);
    blockCellRange(grid, 3, 0, 4, 6); // wall x=3, gap at y=6
    const path = findPathJumpPoint(grid, 0, 0, 6, 0);
    expect(path.length).toBeGreaterThan(0);
    // consecutive jump points share a row or a column (no diagonals)
    for (let idx = 1; idx < path.length; idx++) {
      const [axValue, ayValue] = path[idx - 1];
      const [bxValue, byValue] = path[idx];
      expect(axValue === bxValue || ayValue === byValue).toBe(true);
    }
    expect(path.some(([, rowValue]) => rowValue === 6)).toBe(true);
  });

  it("returns an empty path when walled off", () => {
    const grid = createFlatGrid(5, 5);
    blockCellRange(grid, 2, 0, 3, 5);
    expect(findPathJumpPoint(grid, 0, 2, 4, 2)).toEqual([]);
  });

  it("start equals end returns the single cell", () => {
    const grid = createFlatGrid(3, 3);
    expect(findPathJumpPoint(grid, 2, 2, 2, 2)).toEqual([[2, 2]]);
  });

  it("returns empty when start is blocked", () => {
    const grid = createFlatGrid(3, 3);
    blockCellRange(grid, 0, 0, 1, 1);
    expect(findPathJumpPoint(grid, 0, 0, 2, 2)).toEqual([]);
  });

  it("returns empty when end is blocked", () => {
    const grid = createFlatGrid(3, 3);
    blockCellRange(grid, 2, 2, 3, 3);
    expect(findPathJumpPoint(grid, 0, 0, 2, 2)).toEqual([]);
  });

  it("finds path with vertical movement and forced neighbors", () => {
    const grid = createFlatGrid(5, 6);
    // Create a vertical wall with gaps
    blockCellRange(grid, 2, 1, 3, 4); // wall from (2,1) to (2,3)
    const path = findPathJumpPoint(grid, 2, 0, 2, 5);
    expect(path.length).toBeGreaterThan(0);
  });

  it("navigates around a complex obstacle pattern", () => {
    const grid = createFlatGrid(8, 8);
    blockCellRange(grid, 2, 2, 6, 3); // horizontal wall
    blockCellRange(grid, 4, 3, 5, 6); // vertical wall
    const path = findPathJumpPoint(grid, 1, 1, 7, 7);
    expect(path.length).toBeGreaterThan(0);
  });

  it("handles forced neighbor in horizontal direction", () => {
    const grid = createFlatGrid(6, 5);
    // Create obstacle setup that forces horizontal neighbor detection
    blockCellRange(grid, 2, 0, 3, 2); // vertical wall
    blockCellRange(grid, 2, 3, 3, 5); // another vertical wall
    const path = findPathJumpPoint(grid, 0, 2, 5, 2);
    expect(path.length).toBeGreaterThan(0);
  });

  it("handles multiple jump points in sequence", () => {
    const grid = createFlatGrid(10, 5);
    blockCellRange(grid, 3, 1, 4, 3);
    blockCellRange(grid, 6, 1, 7, 3);
    const path = findPathJumpPoint(grid, 1, 0, 9, 4);
    expect(path.length).toBeGreaterThan(0);
  });

  it("finds purely vertical path", () => {
    const grid = createFlatGrid(3, 5);
    const path = findPathJumpPoint(grid, 1, 0, 1, 4);
    expect(path[0]).toEqual([1, 0]);
    expect(path[path.length - 1]).toEqual([1, 4]);
  });

  it("skips a stale duplicate heap entry once its jump point is already closed", () => {
    // The open list has no decrease-key: relaxing an already-open jump point
    // pushes a second heap entry instead of updating the first. This scattered
    // obstacle pattern gives a jump point two converging routes — one reaches
    // it first with a worse g (worse heap score), then a second route relaxes
    // it to a better g and re-pushes before the stale entry is ever popped.
    // The better entry pops first and closes the point; the stale, higher-cost
    // duplicate pops later and must be skipped via the closed-state check.
    // Layout found by empirical fuzzing over random obstacle grids, then
    // shrunk to this minimal reproduction (see task-3 fix-pass notes).
    const grid = createFlatGrid(6, 6);
    blockCellRange(grid, 4, 1, 5, 2);
    blockCellRange(grid, 1, 2, 2, 3);
    blockCellRange(grid, 0, 3, 1, 4);
    blockCellRange(grid, 3, 3, 4, 4);
    blockCellRange(grid, 5, 3, 6, 4);
    blockCellRange(grid, 2, 4, 3, 5);
    blockCellRange(grid, 4, 4, 5, 5);
    const path = findPathJumpPoint(grid, 0, 0, 5, 5);
    expect(path[0]).toEqual([0, 0]);
    expect(path[path.length - 1]).toEqual([5, 5]);
    expect(path.length).toBeGreaterThan(0);
  });

  it("skips jump points worse than existing path", () => {
    const grid = createFlatGrid(6, 6);
    // Create a diamond-like obstacle to force path comparison
    blockCellRange(grid, 2, 1, 4, 2);
    blockCellRange(grid, 2, 4, 4, 5);
    const path = findPathJumpPoint(grid, 1, 0, 4, 5);
    expect(path.length).toBeGreaterThan(0);
  });

  it("navigates with vertical movement from parent", () => {
    const grid = createFlatGrid(4, 8);
    // Create obstacles that force vertical traversal
    blockCellRange(grid, 1, 1, 3, 2);
    blockCellRange(grid, 1, 4, 3, 5);
    const path = findPathJumpPoint(grid, 2, 0, 2, 7);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual([2, 7]);
  });

  it("explores forced neighbors in different directions", () => {
    const grid = createFlatGrid(7, 7);
    // Top blocked, gap below
    blockCellRange(grid, 2, 0, 5, 1);
    // Right blocked, gap left
    blockCellRange(grid, 5, 3, 6, 6);
    const path = findPathJumpPoint(grid, 1, 0, 6, 6);
    expect(path.length).toBeGreaterThan(0);
  });

  it("finds jump points through complex routing", () => {
    const grid = createFlatGrid(8, 8);
    // Maze-like structure
    blockCellRange(grid, 3, 1, 5, 3);
    blockCellRange(grid, 2, 3, 4, 6);
    blockCellRange(grid, 5, 4, 7, 6);
    const path = findPathJumpPoint(grid, 0, 0, 7, 7);
    expect(path.length).toBeGreaterThan(0);
  });

  it("reaches same jump point from multiple directions", () => {
    const grid = createFlatGrid(10, 8);
    // Create structure where (5, 4) can be reached from different paths
    blockCellRange(grid, 3, 2, 4, 6); // wall blocking direct right path
    blockCellRange(grid, 7, 1, 8, 5); // wall blocking other side
    const path = findPathJumpPoint(grid, 0, 4, 9, 4);
    expect(path.length).toBeGreaterThan(0);
  });

  it("processes vertical neighbor exploration after horizontal approach", () => {
    const grid = createFlatGrid(6, 6);
    // Build a scenario where we approach vertically then need horizontal neighbors
    blockCellRange(grid, 2, 1, 3, 4);
    const path = findPathJumpPoint(grid, 3, 0, 3, 5);
    expect(path.length).toBeGreaterThan(0);
  });

  it("expands intermediate vertical jump points", () => {
    const grid = createFlatGrid(5, 8);
    // Create walls that force vertical intermediate jump points
    blockCellRange(grid, 2, 1, 3, 3);
    blockCellRange(grid, 1, 4, 3, 6);
    const path = findPathJumpPoint(grid, 0, 0, 4, 7);
    expect(path.length).toBeGreaterThan(0);
    // Verify it's a valid path
    for (let idx = 1; idx < path.length; idx++) {
      const [axValue, ayValue] = path[idx - 1];
      const [bxValue, byValue] = path[idx];
      expect(axValue === bxValue || ayValue === byValue).toBe(true);
    }
  });

  it("encounters stale cells in open list during complex search", () => {
    const grid = createFlatGrid(8, 8);
    // Complex maze where same cells might be discovered via different paths
    blockCellRange(grid, 2, 1, 3, 6);
    blockCellRange(grid, 5, 2, 6, 7);
    blockCellRange(grid, 3, 4, 5, 5);
    const path = findPathJumpPoint(grid, 0, 0, 7, 7);
    expect(path.length).toBeGreaterThan(0);
  });

  it("expands cells with vertical parent after vertical jumps", () => {
    const grid = createFlatGrid(5, 8);
    // Create path that forces vertical intermediate jumps
    blockCellRange(grid, 1, 1, 2, 6);
    blockCellRange(grid, 3, 1, 4, 6);
    const path = findPathJumpPoint(grid, 2, 0, 2, 7);
    expect(path.length).toBeGreaterThan(0);
  });

  it("handles deeply nested vertical jumps", () => {
    const grid = createFlatGrid(6, 10);
    // Create a path that requires multiple vertical jumps
    blockCellRange(grid, 1, 1, 2, 3);
    blockCellRange(grid, 3, 5, 4, 7);
    blockCellRange(grid, 1, 8, 2, 9);
    const path = findPathJumpPoint(grid, 3, 0, 3, 9);
    expect(path.length).toBeGreaterThan(0);
  });

  it("finds paths with alternating vertical and horizontal jumps", () => {
    const grid = createFlatGrid(10, 10);
    // Create a maze forcing alternation between vertical and horizontal jumps
    blockCellRange(grid, 3, 2, 4, 4);
    blockCellRange(grid, 2, 4, 3, 6);
    blockCellRange(grid, 4, 6, 5, 8);
    blockCellRange(grid, 3, 8, 4, 10);
    const path = findPathJumpPoint(grid, 0, 0, 9, 9);
    expect(path.length).toBeGreaterThan(0);
  });
});
