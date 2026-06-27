import { describe, expect, it } from "vitest";
import { Position } from "@xyflow/react";
import { getEdgeEndpointsFromStore } from "./getEdgeEndpoints";
import type { InternalNodeLike } from "./getEdgeEndpoints";
import type { Edge } from "@xyflow/react";

const handle = (
  handleId: string | null,
  position: Position,
  offsetX: number,
  offsetY: number,
) => ({
  id: handleId,
  position,
  x: offsetX,
  y: offsetY,
  width: 0,
  height: 0,
});

const edge = (overrides: Partial<Edge> = {}): Edge => ({
  id: "e",
  source: "a",
  target: "b",
  ...overrides,
});

describe("getEdgeEndpointsFromStore", () => {
  it("returns null when an endpoint node is missing", () => {
    const lookup = new Map<string, InternalNodeLike>();
    expect(getEdgeEndpointsFromStore(lookup, edge())).toBeNull();
  });

  it("resolves handle centers by handle id", () => {
    const lookup = new Map<string, InternalNodeLike>([
      [
        "a",
        {
          position: { x: 0, y: 0 },
          internals: {
            positionAbsolute: { x: 10, y: 20 },
            handleBounds: {
              source: [handle("s1", Position.Bottom, 5, 40)],
            },
          },
        },
      ],
      [
        "b",
        {
          position: { x: 0, y: 0 },
          internals: {
            positionAbsolute: { x: 100, y: 200 },
            handleBounds: {
              target: [handle("t1", Position.Top, 5, 0)],
            },
          },
        },
      ],
    ]);

    const result = getEdgeEndpointsFromStore(
      lookup,
      edge({ sourceHandle: "s1", targetHandle: "t1" }),
    );

    expect(result).toEqual({
      sourceX: 15,
      sourceY: 60,
      targetX: 105,
      targetY: 200,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });
  });

  it("falls back to the first handle when the id does not match", () => {
    const lookup = new Map<string, InternalNodeLike>([
      [
        "a",
        {
          position: { x: 0, y: 0 },
          internals: {
            handleBounds: { source: [handle(null, Position.Right, 0, 0)] },
          },
        },
      ],
      [
        "b",
        {
          position: { x: 50, y: 0 },
          internals: {
            handleBounds: { target: [handle(null, Position.Left, 0, 0)] },
          },
        },
      ],
    ]);

    const result = getEdgeEndpointsFromStore(
      lookup,
      edge({ sourceHandle: "missing" }),
    );

    expect(result?.sourcePosition).toBe(Position.Right);
    expect(result?.targetPosition).toBe(Position.Left);
  });

  it("falls back to node borders when there are no handle bounds", () => {
    const lookup = new Map<string, InternalNodeLike>([
      ["a", { position: { x: 0, y: 0 }, measured: { width: 100, height: 40 } }],
      [
        "b",
        { position: { x: 200, y: 0 }, measured: { width: 100, height: 40 } },
      ],
    ]);

    const result = getEdgeEndpointsFromStore(lookup, edge());

    expect(result).toEqual({
      sourceX: 100,
      sourceY: 20,
      targetX: 200,
      targetY: 20,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  });

  it("uses default dimensions when a node is unmeasured", () => {
    const lookup = new Map<string, InternalNodeLike>([
      ["a", { position: { x: 0, y: 0 } }],
      ["b", { position: { x: 500, y: 0 } }],
    ]);

    const result = getEdgeEndpointsFromStore(lookup, edge());

    // Default fallback is 150 x 40.
    expect(result).toEqual({
      sourceX: 150,
      sourceY: 20,
      targetX: 500,
      targetY: 20,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  });
});
