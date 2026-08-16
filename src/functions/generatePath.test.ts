import { describe, expect, it } from "vitest";
import { createFlatGrid, setBlocked } from "../pathfinding/flatGrid";
import {
  NO_PATH_FOUND_ERROR,
  pathfindingAStarDiagonal,
  pathfindingAStarNoDiagonal,
  pathfindingJumpPointNoDiagonal,
} from "./generatePath";

const openGrid = () => createFlatGrid(3, 3);
const blockedGrid = () => {
  const grid = createFlatGrid(3, 3);
  setBlocked(grid, 1, 0, true);
  setBlocked(grid, 1, 1, true);
  setBlocked(grid, 1, 2, true);
  return grid;
};

describe("generatePath", () => {
  it("pathfindingAStarDiagonal finds a diagonal path", () => {
    const grid = openGrid();
    const path = pathfindingAStarDiagonal(grid, { x: 0, y: 0 }, { x: 2, y: 2 });
    expect(path.length).toBeGreaterThan(0);
  });

  it("pathfindingAStarNoDiagonal finds an orthogonal path", () => {
    const grid = openGrid();
    const path = pathfindingAStarNoDiagonal(
      grid,
      { x: 0, y: 0 },
      { x: 2, y: 2 },
    );
    expect(path.length).toBeGreaterThan(0);
  });

  it("pathfindingJumpPointNoDiagonal finds a jump-point path", () => {
    const grid = openGrid();
    const path = pathfindingJumpPointNoDiagonal(
      grid,
      { x: 0, y: 0 },
      { x: 2, y: 2 },
    );
    expect(path.length).toBeGreaterThan(0);
  });

  it.each([
    ["pathfindingAStarDiagonal", pathfindingAStarDiagonal],
    ["pathfindingAStarNoDiagonal", pathfindingAStarNoDiagonal],
    ["pathfindingJumpPointNoDiagonal", pathfindingJumpPointNoDiagonal],
  ] as const)("throws when no path exists (%s)", (_name, pathfinder) => {
    const grid = blockedGrid();
    expect(() => pathfinder(grid, { x: 0, y: 1 }, { x: 2, y: 1 })).toThrow(
      NO_PATH_FOUND_ERROR,
    );
  });
});
