import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { buildEdgeInput, readEdgeOverride } from "./edgeOptions";
import type { EdgeRouteInput } from "./edgeOptions";

const baseEdge: EdgeRouteInput = {
  id: "e",
  source: "a",
  target: "b",
  sourceX: 100,
  sourceY: 25,
  targetX: 300,
  targetY: 25,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

describe("buildEdgeInput", () => {
  it("uses provider defaults when the edge has no override", () => {
    const input = buildEdgeInput(baseEdge, {
      preset: "step",
      gridRatio: 20,
      nodePadding: 5,
      borderRadius: 8,
      avoidAreas: [{ x: 0, y: 0, width: 1, height: 1 }],
    });

    expect(input.preset).toBe("step");
    expect(input.options).toEqual({
      gridRatio: 20,
      nodePadding: 5,
      borderRadius: 8,
      avoidAreas: [{ x: 0, y: 0, width: 1, height: 1 }],
    });
  });

  it("falls back to the bezier preset when none is configured", () => {
    expect(buildEdgeInput(baseEdge, {}).preset).toBe("bezier");
  });

  it("applies a valid override and filters malformed avoid areas", () => {
    const input = buildEdgeInput(
      {
        ...baseEdge,
        data: {
          smartEdge: {
            preset: "smoothstep",
            options: {
              gridRatio: 12,
              borderRadius: 4,
              avoidAreas: [
                { x: 1, y: 2, width: 3, height: 4 },
                "not-a-record",
                { x: 1 },
                { x: 1, y: 1 },
                { x: 1, y: 1, width: 1 },
              ],
            },
          },
        },
      },
      { preset: "bezier", nodePadding: 9 },
    );

    expect(input.preset).toBe("smoothstep");
    expect(input.options?.gridRatio).toBe(12);
    expect(input.options?.borderRadius).toBe(4);
    // Falls through to the provider default since the override omits it.
    expect(input.options?.nodePadding).toBe(9);
    expect(input.options?.avoidAreas).toEqual([
      { x: 1, y: 2, width: 3, height: 4 },
    ]);
  });

  it("ignores an invalid preset and non-numeric/non-array options", () => {
    const input = buildEdgeInput(
      {
        ...baseEdge,
        data: {
          smartEdge: {
            preset: "nope",
            options: { gridRatio: "x", avoidAreas: "y" },
          },
        },
      },
      { preset: "straight" },
    );

    expect(input.preset).toBe("straight");
    expect(input.options?.gridRatio).toBeUndefined();
    expect(input.options?.avoidAreas).toBeUndefined();
  });
});

describe("readEdgeOverride", () => {
  it("returns empty for non-record data", () => {
    expect(readEdgeOverride(undefined)).toEqual({});
    expect(readEdgeOverride("nope")).toEqual({});
  });

  it("returns empty when smartEdge is absent or not an object", () => {
    expect(readEdgeOverride({ foo: 1 })).toEqual({});
    expect(readEdgeOverride({ smartEdge: "x" })).toEqual({});
  });

  it("reads a malformed options value as empty options", () => {
    expect(readEdgeOverride({ smartEdge: { options: "x" } })).toEqual({
      options: {},
    });
  });
});
