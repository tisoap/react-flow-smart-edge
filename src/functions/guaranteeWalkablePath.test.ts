import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { createGrid } from "../pathfinding/grid";
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
    const grid = createGrid(7, 5);
    grid.setWalkableAt(3, 2, false);
    grid.setWalkableAt(4, 2, false);

    guaranteeWalkablePath(grid, { x: 3, y: 2 }, Position.Right);

    expect(grid.isWalkableAt(3, 2)).toBe(true);
    expect(grid.isWalkableAt(4, 2)).toBe(true);
    expect(grid.isWalkableAt(5, 2)).toBe(true);
  });
});
