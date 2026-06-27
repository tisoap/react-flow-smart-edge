import { describe, expect, it } from "vitest";
import { Position } from "@xyflow/react";
import { computeHoppedPath } from "./smartEdgeHops";
import type { ComputeHoppedPathParams } from "./smartEdgeHops";
import { pathfindingJumpPointNoDiagonal } from "../functions";
import type { InternalNodeLike, PathFindingFunction } from "../functions";
import type { Edge, Node } from "@xyflow/react";

const makeNode = (nodeId: string, posX: number, posY: number): Node => ({
  id: nodeId,
  position: { x: posX, y: posY },
  data: {},
  measured: { width: 1, height: 1 },
});

const internalNode = (
  posX: number,
  posY: number,
  type: "source" | "target",
  position: Position,
): InternalNodeLike => ({
  position: { x: posX, y: posY },
  measured: { width: 1, height: 1 },
  internals: {
    positionAbsolute: { x: posX, y: posY },
    handleBounds: {
      [type]: [{ id: null, position, x: 0, y: 0, width: 0, height: 0 }],
    },
  },
});

const nodes: Node[] = [
  makeNode("vTop", 200, 0),
  makeNode("vBottom", 200, 300),
  makeNode("hLeft", 0, 150),
  makeNode("hRight", 400, 150),
];

const nodeLookup = new Map<string, InternalNodeLike>([
  ["vTop", internalNode(200, 0, "source", Position.Bottom)],
  ["vBottom", internalNode(200, 300, "target", Position.Top)],
  ["hLeft", internalNode(0, 150, "source", Position.Right)],
  ["hRight", internalNode(400, 150, "target", Position.Left)],
]);

const verticalEdge: Edge = {
  id: "v",
  source: "vTop",
  target: "vBottom",
  type: "hop",
};
const horizontalEdge: Edge = {
  id: "h",
  source: "hLeft",
  target: "hRight",
  type: "hop",
};

const baseParams = (
  overrides: Partial<ComputeHoppedPathParams> = {},
): ComputeHoppedPathParams => ({
  edges: [verticalEdge, horizontalEdge],
  nodeLookup,
  nodes,
  edgeId: "h",
  edgeType: "hop",
  sourceNodeId: "hLeft",
  targetNodeId: "hRight",
  source: { x: 0, y: 150, position: Position.Right },
  target: { x: 400, y: 150, position: Position.Left },
  options: { generatePath: pathfindingJumpPointNoDiagonal },
  hops: true,
  ...overrides,
});

describe("computeHoppedPath", () => {
  it("draws a bridge where the top edge crosses the one beneath it", () => {
    const path = computeHoppedPath(baseParams());
    expect(path).toMatch(/A \d/);
  });

  it("returns null when the edge is not in the edge list", () => {
    expect(computeHoppedPath(baseParams({ edgeId: "missing" }))).toBeNull();
  });

  it("draws no bridge for the bottom edge (no lower-index siblings)", () => {
    const path = computeHoppedPath(
      baseParams({
        edgeId: "v",
        sourceNodeId: "vTop",
        targetNodeId: "vBottom",
        source: { x: 200, y: 0, position: Position.Bottom },
        target: { x: 200, y: 300, position: Position.Top },
      }),
    );
    expect(path).not.toBeNull();
    expect(path).not.toMatch(/A \d/);
  });

  it("ignores edges of a different type", () => {
    const other: Edge = { ...verticalEdge, id: "x", type: "different" };
    const path = computeHoppedPath(
      baseParams({ edges: [other, verticalEdge, horizontalEdge] }),
    );
    expect(path).toMatch(/A \d/);
  });

  it("skips sibling edges whose endpoints cannot be resolved", () => {
    const ghost: Edge = {
      id: "ghost",
      source: "nope",
      target: "nope",
      type: "hop",
    };
    const path = computeHoppedPath(
      baseParams({ edges: [ghost, verticalEdge, horizontalEdge] }),
    );
    expect(path).toMatch(/A \d/);
  });

  it("returns null when this edge's own route fails", () => {
    const throwing: PathFindingFunction = () => {
      throw new Error("boom");
    };
    const path = computeHoppedPath(
      baseParams({ options: { generatePath: throwing } }),
    );
    expect(path).toBeNull();
  });

  it("skips a sibling edge whose route fails", () => {
    let calls = 0;
    const flaky: PathFindingFunction = (grid, start, end) => {
      calls += 1;
      if (calls === 1) return pathfindingJumpPointNoDiagonal(grid, start, end);
      throw new Error("boom");
    };
    const path = computeHoppedPath(
      baseParams({ options: { generatePath: flaky } }),
    );
    // My route succeeded (first call); the sibling failed, so no bridge.
    expect(path).not.toBeNull();
    expect(path).not.toMatch(/A \d/);
  });

  it("uses default hop config for a falsy flag or an empty object", () => {
    expect(computeHoppedPath(baseParams({ hops: false }))).toMatch(/A \d/);
    expect(computeHoppedPath(baseParams({ hops: {} }))).toMatch(/A \d/);
  });

  it("honors an explicit hop config", () => {
    const path = computeHoppedPath(
      baseParams({ hops: { radius: 8, borderRadius: 4, epsilon: 1 } }),
    );
    expect(path).toMatch(/A 8 8 /);
  });
});
