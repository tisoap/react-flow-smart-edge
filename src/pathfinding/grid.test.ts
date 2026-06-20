import { describe, expect, it } from "vitest";
import { createGrid } from "./grid";

describe("createGrid", () => {
  it("creates a walkable grid from a matrix", () => {
    const grid = createGrid(3, 2, [
      [0, 1, 0],
      [0, 0, 0],
    ]);

    expect(grid.isWalkableAt(0, 0)).toBe(true);
    expect(grid.isWalkableAt(1, 0)).toBe(false);
    expect(grid.getNodeAt(2, 1).walkable).toBe(true);
  });

  it("ignores out-of-bounds writes and reports inside/outside correctly", () => {
    const grid = createGrid(2, 2);

    grid.setWalkableAt(-1, 0, false);
    grid.setWalkableAt(5, 5, false);

    expect(grid.isInside(0, 0)).toBe(true);
    expect(grid.isInside(2, 0)).toBe(false);
    expect(grid.isWalkableAt(5, 5)).toBe(false);
  });

  it("clones walkability independently", () => {
    const grid = createGrid(2, 2);
    grid.setWalkableAt(0, 0, false);

    const copy = grid.clone();
    copy.setWalkableAt(1, 1, false);

    expect(grid.isWalkableAt(1, 1)).toBe(true);
    expect(copy.isWalkableAt(0, 0)).toBe(false);
  });

  it("returns diagonal neighbors when allowed", () => {
    const grid = createGrid(2, 2);
    const center = grid.getNodeAt(0, 0);
    const neighbors = grid.getNeighbors(center, "Always");

    expect(neighbors).toHaveLength(3);
    expect(neighbors.map((node) => [node.x, node.y])).toEqual(
      expect.arrayContaining([
        [1, 0],
        [0, 1],
        [1, 1],
      ]),
    );
  });
});
