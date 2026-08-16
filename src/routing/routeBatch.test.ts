import { Position } from "@xyflow/react";
import { describe, expect, it, vi, afterEach, beforeAll } from "vitest";
import { routeSmartEdgeBatch } from "./routeBatch";
import type { Node } from "@xyflow/react";
import type { SmartEdgeBatchItem } from "./routeBatch";

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

const edge = (
  overrides: Partial<SmartEdgeBatchItem> = {},
): SmartEdgeBatchItem => ({
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

describe("routeSmartEdgeBatch", () => {
  beforeAll(async () => {
    getSmartEdgeModule = await import("../getSmartEdge");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes each edge keyed by id, wrapped as a routed result", () => {
    const results = routeSmartEdgeBatch(nodes, [
      edge(),
      edge({ id: "e2", preset: "smoothstep", options: { borderRadius: 8 } }),
    ]);

    const first = results["e1"];
    const second = results["e2"];
    expect(first).toMatchObject({ kind: "routed", wasRouted: true });
    expect(second).toMatchObject({ kind: "routed", wasRouted: true });
    if (first.kind !== "routed" || second.kind !== "routed") return;
    expect(first.svgPathString).toMatch(/^M/);
    expect(second.svgPathString).toMatch(/^M/);
  });

  it("passes serializable options through to routing", () => {
    const results = routeSmartEdgeBatch(nodes, [
      edge({
        preset: "step",
        options: {
          gridRatio: 20,
          nodePadding: 5,
          avoidAreas: [{ x: 150, y: 0, width: 20, height: 60 }],
        },
      }),
    ]);

    expect(results["e1"]).toBeDefined();
  });

  it("routes a waypoint edge through the (grid-snapped) waypoint", () => {
    const waypointNodes: Node[] = [
      {
        id: "source",
        position: { x: 80, y: 200 },
        measured: { width: 150, height: 40 },
        data: {},
      },
      {
        id: "target",
        position: { x: 520, y: 200 },
        measured: { width: 150, height: 40 },
        data: {},
      },
    ];

    const results = routeSmartEdgeBatch(waypointNodes, [
      edge({
        source: "source",
        target: "target",
        sourceX: 230,
        sourceY: 220,
        targetX: 520,
        targetY: 220,
        waypoints: [{ x: 363, y: 43 }],
      }),
    ]);

    const result = results["e1"];
    expect(result).toMatchObject({ kind: "routed", wasRouted: true });
    if (result.kind !== "routed") return;
    expect(
      result.points.some(([posX, posY]) => posX === 360 && posY === 40),
    ).toBe(true);
  });

  it("omits an edge that fails to route (e.g. a fully enclosed target)", () => {
    vi.spyOn(getSmartEdgeModule, "getSmartEdge").mockReturnValue(
      new Error("no path"),
    );

    const results = routeSmartEdgeBatch(nodes, [edge()]);

    expect(results).toEqual({});
  });

  it("excludes the edge's ancestor container from the obstacle set (subflow)", () => {
    const subflowNodes: Node[] = [
      {
        id: "container",
        position: { x: 100, y: 100 },
        measured: { width: 300, height: 300 },
        data: {},
      },
      {
        id: "child",
        parentId: "container",
        position: { x: 50, y: 50 },
        measured: { width: 60, height: 40 },
        data: {},
      },
      {
        id: "outside",
        position: { x: 600, y: 150 },
        measured: { width: 100, height: 50 },
        data: {},
      },
    ];

    const seenNodeIds: string[][] = [];
    const original = getSmartEdgeModule.getSmartEdge;
    vi.spyOn(getSmartEdgeModule, "getSmartEdge").mockImplementation(
      (params) => {
        seenNodeIds.push(params.nodes.map((node) => node.id));
        return original(params);
      },
    );

    const results = routeSmartEdgeBatch(subflowNodes, [
      edge({
        source: "child",
        target: "outside",
        sourceX: 210,
        sourceY: 170,
        targetX: 600,
        targetY: 175,
      }),
    ]);

    expect(seenNodeIds[0]).toEqual(["child", "outside"]);
    expect(results["e1"]).toMatchObject({ kind: "routed", wasRouted: true });
  });
});
