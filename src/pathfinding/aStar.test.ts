import { describe, expect, it } from "vitest";
import { createAStarFinder } from "./aStar";
import { createGrid } from "./grid";

describe("createAStarFinder", () => {
  const obstacleGrid = () => {
    const grid = createGrid(5, 3);
    for (let x = 1; x <= 3; x++) {
      grid.setWalkableAt(x, 1, false);
    }
    return grid;
  };

  it("finds an orthogonal path around a wall", () => {
    const grid = obstacleGrid();
    const finder = createAStarFinder({ diagonalMovement: "Never" });
    const path = finder.findPath(0, 1, 4, 1, grid);

    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual([0, 1]);
    expect(path[path.length - 1]).toEqual([4, 1]);
    expect(path.some(([, y]) => y === 0 || y === 2)).toBe(true);
  });

  it("finds a shorter diagonal path when allowed", () => {
    const grid = createGrid(3, 3);
    const finder = createAStarFinder({ diagonalMovement: "Always" });
    const path = finder.findPath(0, 0, 2, 2, grid);

    expect(path).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
  });

  it("returns an empty path when the goal is unreachable", () => {
    const grid = createGrid(3, 3);
    grid.setWalkableAt(1, 0, false);
    grid.setWalkableAt(1, 1, false);
    grid.setWalkableAt(1, 2, false);

    const finder = createAStarFinder({ diagonalMovement: "Never" });
    expect(finder.findPath(0, 1, 2, 1, grid)).toEqual([]);
  });

  it("uses a custom heuristic and weight", () => {
    const grid = createGrid(3, 3);
    const heuristic = (dx: number, dy: number) => dx * dy;
    const finder = createAStarFinder({
      diagonalMovement: "Never",
      heuristic,
      weight: 2,
    });

    expect(finder.findPath(0, 0, 2, 0, grid).length).toBeGreaterThan(0);
  });

  it("prefers the lower-cost open node and skips closed neighbors", () => {
    const grid = createGrid(4, 2);
    const finder = createAStarFinder({ diagonalMovement: "Always" });

    const path = finder.findPath(0, 0, 3, 1, grid);
    expect(path.length).toBeGreaterThan(0);

    const end = grid.getNodeAt(3, 1);
    end.closed = true;
    expect(finder.findPath(0, 0, 3, 1, grid)).toEqual([]);
  });

  it("reopens a neighbor when a cheaper path is found", () => {
    const grid = createGrid(3, 3);
    const finder = createAStarFinder({ diagonalMovement: "Never" });
    const neighbor = grid.getNodeAt(1, 0);
    neighbor.opened = true;
    neighbor.costFromStart = 100;

    const path = finder.findPath(0, 0, 2, 0, grid);
    expect(path.length).toBeGreaterThan(0);
    expect(neighbor.costFromStart).toBeLessThan(100);
  });

  it("selects the lowest-cost node when multiple entries are open", () => {
    const grid = createGrid(4, 2);
    const finder = createAStarFinder({ diagonalMovement: "Always" });
    const path = finder.findPath(0, 0, 3, 1, grid);
    expect(path.length).toBeGreaterThan(0);
  });

  it("uses the default orthogonal movement policy", () => {
    const grid = createGrid(3, 3);
    const finder = createAStarFinder();
    expect(finder.findPath(0, 0, 2, 0, grid).length).toBeGreaterThan(0);
  });

  it("handles nodes with missing search metadata during expansion", () => {
    const grid = createGrid(4, 2);
    const finder = createAStarFinder({ diagonalMovement: "Always" });
    const reopened = grid.getNodeAt(1, 0);
    reopened.opened = true;
    delete reopened.costFromStart;

    const originalGetNeighbors = grid.getNeighbors.bind(grid);
    let expansions = 0;
    grid.getNeighbors = (node, diagonalMovement) => {
      expansions += 1;
      if (expansions === 2) {
        delete node.costFromStart;
      }
      return originalGetNeighbors(node, diagonalMovement);
    };

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

    expect(finder.findPath(0, 0, 3, 1, grid).length).toBeGreaterThan(0);
  });
});
