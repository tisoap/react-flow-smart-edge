import { describe, expect, it } from "vitest";
import { Position } from "@xyflow/react";
import { applyControlPointsUpdate, hoppedClearRoute } from "./renderDecision";
import type { ControlPointData } from "./ControlPoint";
import type { Edge } from "@xyflow/react";

const edges: Edge[] = [
  { id: "e1", source: "a", target: "b", data: { points: [] } },
  {
    id: "e2",
    source: "a",
    target: "b",
    data: { points: [{ id: "other", x: 1, y: 2 }] },
  },
];

describe("applyControlPointsUpdate", () => {
  it("rewrites only the matching edge's points", () => {
    const added: ControlPointData = { id: "wp-1", x: 5, y: 6, active: true };
    const result = applyControlPointsUpdate(edges, "e1", (points) => [
      ...points,
      added,
    ]);

    expect(result[0].data).toEqual({ points: [added] });
    expect(result[1]).toBe(edges[1]);
  });

  it("leaves every edge untouched when none match", () => {
    const result = applyControlPointsUpdate(edges, "missing", () => [
      { id: "wp-1", x: 0, y: 0 },
    ]);

    expect(result[0]).toBe(edges[0]);
    expect(result[1]).toBe(edges[1]);
  });
});

describe("hoppedClearRoute", () => {
  it("centers the label on the endpoint midpoint", () => {
    const route = hoppedClearRoute("M 0,0 L 10,0", {
      sourceX: 0,
      sourceY: 0,
      targetX: 10,
      targetY: 20,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });

    expect(route).toEqual({
      kind: "routed",
      wasRouted: true,
      svgPathString: "M 0,0 L 10,0",
      edgeCenterX: 5,
      edgeCenterY: 10,
      points: [],
    });
  });
});
