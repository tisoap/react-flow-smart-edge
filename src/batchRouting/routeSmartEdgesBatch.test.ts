import { Position } from "@xyflow/react";
import { describe, expect, it, vi, afterEach, beforeAll } from "vitest";
import { routeSmartEdgesBatch } from "./routeSmartEdgesBatch";
import type { Node } from "@xyflow/react";
import type { BatchEdgeInput } from "./routeSmartEdgesBatch";

let getSmartEdgeModule: typeof import("../getSmartEdge");

const nodes: Node[] = [
  {
    id: "a",
    position: { x: 0, y: 0 },
    measured: { width: 100, height: 50 },
    data: {},
  },
  {
    id: "b",
    position: { x: 300, y: 0 },
    measured: { width: 100, height: 50 },
    data: {},
  },
];

const edge = (overrides: Partial<BatchEdgeInput> = {}): BatchEdgeInput => ({
  id: "e1",
  source: "a",
  target: "b",
  sourceX: 100,
  sourceY: 25,
  targetX: 300,
  targetY: 25,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  preset: "bezier",
  ...overrides,
});

describe("routeSmartEdgesBatch", () => {
  beforeAll(async () => {
    getSmartEdgeModule = await import("../getSmartEdge");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes each edge keyed by id", () => {
    const results = routeSmartEdgesBatch({
      nodes,
      edges: [
        edge(),
        edge({ id: "e2", preset: "smoothstep", options: { borderRadius: 8 } }),
      ],
    });

    expect(results["e1"].svgPathString).toMatch(/^M/);
    expect(results["e2"].svgPathString).toMatch(/^M/);
  });

  it("passes serializable options through to routing", () => {
    const results = routeSmartEdgesBatch({
      nodes,
      edges: [
        edge({
          preset: "step",
          options: {
            gridRatio: 20,
            nodePadding: 5,
            avoidAreas: [{ x: 150, y: 0, width: 20, height: 60 }],
          },
        }),
      ],
    });

    expect(results["e1"]).toBeDefined();
  });

  it("omits edges that fail to route", () => {
    vi.spyOn(getSmartEdgeModule, "getSmartEdge").mockReturnValue(
      new Error("no path"),
    );

    const results = routeSmartEdgesBatch({ nodes, edges: [edge()] });

    expect(results).toEqual({});
  });
});
