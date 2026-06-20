import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { createGrid as createRoutingGrid } from "./createGrid";
import { getBoundingBoxes } from "./getBoundingBoxes";
import type { Node } from "@xyflow/react";

const testNode = (id: string, x: number, y: number): Node => ({
  id,
  position: { x, y },
  measured: { width: 100, height: 50 },
  data: {},
});

describe("createGrid", () => {
  it("marks node areas blocked and offsets start/end past the handles", () => {
    const nodes = [testNode("a", 100, 100), testNode("b", 400, 100)];
    const { graphBox, nodeBoxes } = getBoundingBoxes(nodes, 10, 10, [], [
      { x: 200, y: 125 },
      { x: 300, y: 125 },
    ]);

    const { grid, start, end } = createRoutingGrid(
      graphBox,
      nodeBoxes,
      { x: 200, y: 125, position: Position.Right },
      { x: 300, y: 125, position: Position.Left },
      10,
    );

    expect(grid.isWalkableAt(start.x, start.y)).toBe(true);
    expect(grid.isWalkableAt(end.x, end.y)).toBe(true);
    expect(start).toEqual({ x: expect.any(Number), y: expect.any(Number) });
    expect(end.x).not.toBe(start.x);
  });
});
