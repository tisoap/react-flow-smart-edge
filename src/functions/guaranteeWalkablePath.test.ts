import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import {
  createFlatGrid,
  isWalkable,
  setBlocked,
} from "../pathfinding/flatGrid";
import {
  getNextPointFromPosition,
  guaranteeWalkablePath,
} from "./guaranteeWalkablePath";

describe("getNextPointFromPosition", () => {
  const point = { x: 5, y: 5 };

  it.each([
    [Position.Top, { x: 5, y: 4 }],
    [Position.Bottom, { x: 5, y: 6 }],
    [Position.Left, { x: 4, y: 5 }],
    [Position.Right, { x: 6, y: 5 }],
  ] as const)("steps %s from a point", (position, expected) => {
    expect(getNextPointFromPosition(point, position)).toEqual(expected);
  });
});

describe("guaranteeWalkablePath", () => {
  it("clears blocked cells toward the handle direction until walkable", () => {
    const grid = createFlatGrid(7, 5);
    setBlocked(grid, 3, 2, true);
    setBlocked(grid, 4, 2, true);

    guaranteeWalkablePath(grid, { x: 3, y: 2 }, Position.Right);

    expect(isWalkable(grid, 3, 2)).toBe(true);
    expect(isWalkable(grid, 4, 2)).toBe(true);
    expect(isWalkable(grid, 5, 2)).toBe(true);
  });

  it("stops at the grid border instead of walking off the edge", () => {
    const grid = createFlatGrid(3, 3);
    setBlocked(grid, 0, 1, true);
    setBlocked(grid, 1, 1, true);
    setBlocked(grid, 2, 1, true);

    // The whole row is blocked, so walking left from column 1 must stop once
    // it steps outside the grid instead of throwing or looping forever.
    guaranteeWalkablePath(grid, { x: 1, y: 1 }, Position.Left);

    expect(isWalkable(grid, 0, 1)).toBe(true);
    expect(isWalkable(grid, 1, 1)).toBe(true);
  });
});
