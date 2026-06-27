import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import {
  buildObstacleMatrix,
  createGrid as createRoutingGrid,
} from "./createGrid";
import { getBoundingBoxes } from "./getBoundingBoxes";
import type { NodeBoundingBox } from "./getBoundingBoxes";
import type { Node } from "@xyflow/react";

const testNode = (nodeId: string, posX: number, posY: number): Node => ({
  id: nodeId,
  position: { x: posX, y: posY },
  measured: { width: 100, height: 50 },
  data: {},
});

describe("createGrid", () => {
  it("marks node areas blocked and offsets start/end past the handles", () => {
    const nodes = [testNode("a", 100, 100), testNode("b", 400, 100)];
    const { graphBox, nodeBoxes } = getBoundingBoxes(
      nodes,
      10,
      10,
      [],
      [
        { x: 200, y: 125 },
        { x: 300, y: 125 },
      ],
    );

    const { grid, start, end } = createRoutingGrid(
      graphBox,
      nodeBoxes,
      { x: 200, y: 125, position: Position.Right },
      { x: 300, y: 125, position: Position.Left },
      10,
    );

    expect(grid.isWalkableAt(start.x, start.y)).toBe(true);
    expect(grid.isWalkableAt(end.x, end.y)).toBe(true);
    expect(typeof start.x).toBe("number");
    expect(typeof start.y).toBe("number");
    expect(end.x).not.toBe(start.x);
  });

  it("produces an identical grid from a precomputed obstacle matrix", () => {
    const nodes = [testNode("a", 100, 100), testNode("b", 400, 100)];
    const { graphBox, nodeBoxes } = getBoundingBoxes(
      nodes,
      10,
      10,
      [],
      [
        { x: 200, y: 125 },
        { x: 300, y: 125 },
      ],
    );
    const source = { x: 200, y: 125, position: Position.Right };
    const target = { x: 300, y: 125, position: Position.Left };

    const built = createRoutingGrid(graphBox, nodeBoxes, source, target, 10);

    const matrix = buildObstacleMatrix(graphBox, nodeBoxes, 10);
    const reused = createRoutingGrid(
      graphBox,
      nodeBoxes,
      source,
      target,
      10,
      matrix,
    );

    expect(reused.grid.width).toBe(built.grid.width);
    expect(reused.grid.height).toBe(built.grid.height);
    for (let row = 0; row < built.grid.height; row++) {
      for (let column = 0; column < built.grid.width; column++) {
        expect(reused.grid.isWalkableAt(column, row)).toBe(
          built.grid.isWalkableAt(column, row),
        );
      }
    }
  });
});

describe("buildObstacleMatrix", () => {
  it("marks node cells as blocked and leaves free cells walkable", () => {
    const nodes = [testNode("a", 100, 100)];
    const { graphBox, nodeBoxes } = getBoundingBoxes(nodes, 10, 10);

    const matrix = buildObstacleMatrix(graphBox, nodeBoxes, 10);

    const hasBlockedCell = matrix.some((gridRow) =>
      gridRow.some((cell) => cell === 1),
    );
    const hasFreeCell = matrix.some((gridRow) =>
      gridRow.some((cell) => cell === 0),
    );
    expect(hasBlockedCell).toBe(true);
    expect(hasFreeCell).toBe(true);
  });

  it("ignores node cells that fall outside the grid bounds", () => {
    const nodes = [testNode("a", 100, 100)];
    const { graphBox } = getBoundingBoxes(nodes, 10, 10);

    // A box that starts far above/left of the graph box (negative grid cells)
    // and ends just inside it, so the marking loop produces both out-of-bounds
    // and in-bounds cells.
    const overflowingBox: NodeBoundingBox = {
      id: "overflow",
      width: 0,
      height: 0,
      topLeft: { x: graphBox.xMin - 1000, y: graphBox.yMin - 1000 },
      bottomLeft: { x: graphBox.xMin - 1000, y: graphBox.yMin + 20 },
      topRight: { x: graphBox.xMin + 20, y: graphBox.yMin - 1000 },
      bottomRight: { x: graphBox.xMin + 20, y: graphBox.yMin + 20 },
    };

    const matrix = buildObstacleMatrix(graphBox, [overflowingBox], 10);

    // No row index is ever negative, and only the in-bounds cells are blocked.
    expect(matrix.length).toBeGreaterThan(0);
    expect(matrix[0][0]).toBe(1);
  });
});
