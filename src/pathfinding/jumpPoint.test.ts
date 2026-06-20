import { describe, expect, it } from "vitest";
import { createJumpPointFinder } from "./jumpPoint";
import { createGrid } from "./grid";

describe("createJumpPointFinder", () => {
  it("finds an orthogonal jump-point path around obstacles", () => {
    const grid = createGrid(5, 3);
    for (let x = 1; x <= 3; x++) {
      grid.setWalkableAt(x, 1, false);
    }

    const finder = createJumpPointFinder();
    const path = finder.findPath(0, 1, 4, 1, grid);

    expect(path[0]).toEqual([0, 1]);
    expect(path[path.length - 1]).toEqual([4, 1]);
  });

  it("returns an empty path when the goal is unreachable", () => {
    const grid = createGrid(3, 3);
    grid.setWalkableAt(1, 0, false);
    grid.setWalkableAt(1, 1, false);
    grid.setWalkableAt(1, 2, false);

    const finder = createJumpPointFinder();
    expect(finder.findPath(0, 1, 2, 1, grid)).toEqual([]);
  });

  it("returns no neighbors when movement direction collapses to zero", () => {
    const grid = createGrid(3, 3);
    const start = grid.getNodeAt(1, 1);
    start.parent = grid.getNodeAt(1, 1);

    const finder = createJumpPointFinder();
    expect(finder.findPath(1, 1, 2, 2, grid)).toEqual([]);
  });

  it("expands multiple open jump points by estimated total cost", () => {
    const grid = createGrid(6, 3);
    grid.setWalkableAt(2, 1, false);
    grid.setWalkableAt(3, 1, false);

    const finder = createJumpPointFinder();
    expect(finder.findPath(0, 1, 5, 1, grid).length).toBeGreaterThan(0);
  });

  it("handles nodes with missing search metadata during relaxation", () => {
    const grid = createGrid(5, 3);
    for (let x = 1; x <= 3; x++) {
      grid.setWalkableAt(x, 1, false);
    }

    const reopened = grid.getNodeAt(2, 0);
    reopened.opened = true;
    delete reopened.costFromStart;

    for (const node of grid.nodes.flat()) {
      Object.defineProperty(node, "estimatedTotalCost", {
        configurable: true,
        get() {
          return undefined;
        },
        set(value: number | undefined) {
          Object.defineProperty(this, "estimatedTotalCost", {
            configurable: true,
            writable: true,
            value,
          });
        },
      });
    }

    const finder = createJumpPointFinder();
    expect(finder.findPath(0, 1, 4, 1, grid).length).toBeGreaterThan(0);
  });
});
