import { describe, expect, it, vi } from "vitest";
import { createGrid } from "../pathfinding/grid";
import * as aStarModule from "../pathfinding/aStar";
import * as jumpPointModule from "../pathfinding/jumpPoint";
import {
  pathfindingAStarDiagonal,
  pathfindingAStarNoDiagonal,
  pathfindingJumpPointNoDiagonal,
} from "./generatePath";

const openGrid = () => createGrid(3, 3);
const blockedGrid = () => {
  const grid = createGrid(3, 3);
  grid.setWalkableAt(1, 0, false);
  grid.setWalkableAt(1, 1, false);
  grid.setWalkableAt(1, 2, false);
  return grid;
};

const throwUnknown = (): never => {
  // eslint-disable-next-line @typescript-eslint/only-throw-error -- verifies unknown error wrapping
  throw "boom";
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
      "No path found",
    );
  });

  it.each([
    ["pathfindingAStarDiagonal", pathfindingAStarDiagonal],
    ["pathfindingAStarNoDiagonal", pathfindingAStarNoDiagonal],
  ] as const)("wraps non-Error throws (%s)", (_name, pathfinder) => {
    vi.spyOn(aStarModule, "createAStarFinder").mockReturnValue({
      findPath: (): number[][] => throwUnknown(),
    });

    const grid = openGrid();
    expect(() => pathfinder(grid, { x: 0, y: 0 }, { x: 2, y: 2 })).toThrow(
      "Unknown error: boom",
    );

    vi.restoreAllMocks();
  });

  it("wraps non-Error throws (pathfindingJumpPointNoDiagonal)", () => {
    vi.spyOn(jumpPointModule, "createJumpPointFinder").mockReturnValue({
      findPath: (): number[][] => throwUnknown(),
    });

    const grid = openGrid();
    expect(() =>
      pathfindingJumpPointNoDiagonal(grid, { x: 0, y: 0 }, { x: 2, y: 2 }),
    ).toThrow("Unknown error: boom");

    vi.restoreAllMocks();
  });
});
