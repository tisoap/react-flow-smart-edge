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
    expect(path.some(([x, y]) => y === 0 || y === 2)).toBe(true);
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
});
