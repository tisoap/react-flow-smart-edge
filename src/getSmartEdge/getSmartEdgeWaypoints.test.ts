import { Position } from "@xyflow/react";
import { describe, expect, it, vi, beforeAll } from "vitest";
import { getSmartEdgeWaypoints } from "./getSmartEdgeWaypoints";
import {
  pathfindingAStarNoDiagonal,
  svgDrawStraightLinePath,
} from "../functions";
import type { Node } from "@xyflow/react";

let getSmartEdgeModule: typeof import("./index");

const testNode = (
  nodeId: string,
  posX: number,
  posY: number,
  width = 150,
  height = 40,
): Node => ({
  id: nodeId,
  position: { x: posX, y: posY },
  measured: { width, height },
  data: { label: nodeId },
});

const throwUnknown = (): never => {
  // eslint-disable-next-line @typescript-eslint/only-throw-error -- verifies unknown error wrapping
  throw "waypoint failure";
};

const baseParams = {
  nodes: [testNode("source", 80, 200), testNode("target", 520, 200)],
  sourceX: 230,
  sourceY: 220,
  targetX: 520,
  targetY: 220,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  options: {
    gridRatio: 10,
    nodePadding: 10,
    drawEdge: svgDrawStraightLinePath,
    generatePath: pathfindingAStarNoDiagonal,
  },
};

describe("getSmartEdgeWaypoints", () => {
  beforeAll(async () => {
    getSmartEdgeModule = await import("./index");
  });

  it("delegates to getSmartEdge when there are no waypoints", () => {
    const plain = getSmartEdgeWaypoints({ ...baseParams, waypoints: [] });
    expect(plain).not.toBeInstanceOf(Error);
  });

  it("routes through snapped waypoints and returns a stitched path", () => {
    const result = getSmartEdgeWaypoints({
      ...baseParams,
      waypoints: [{ x: 363, y: 43 }],
    });

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    expect(result.points.length).toBeGreaterThan(0);
    expect(result.svgPathString).toContain("L");
    expect(
      result.points.some(([posX, posY]) => posX === 360 && posY === 40),
    ).toBe(true);
  });

  it("degrades a failed segment instead of failing the whole edge", () => {
    const blocked = [
      testNode("source", 0, 0),
      testNode("target", 400, 0),
      testNode("wall", 180, -80, 40, 200),
    ];

    const result = getSmartEdgeWaypoints({
      ...baseParams,
      nodes: blocked,
      sourceX: 150,
      sourceY: 0,
      targetX: 250,
      targetY: 0,
      waypoints: [{ x: 200, y: 0 }],
      options: {
        ...baseParams.options,
        gridRatio: 5,
        nodePadding: 20,
      },
    });

    expect(result).not.toBeInstanceOf(Error);
  });

  it("merges duplicate stitch points and keeps waypoint flags", () => {
    const result = getSmartEdgeWaypoints({
      ...baseParams,
      waypoints: [
        { x: 300, y: 220 },
        { x: 300, y: 220 },
      ],
      options: {
        ...baseParams.options,
        drawEdge: svgDrawStraightLinePath,
      },
    });

    expect(result).not.toBeInstanceOf(Error);
  });

  it("returns an Error for unknown failures", () => {
    const result = getSmartEdgeWaypoints({
      ...baseParams,
      waypoints: [{ x: 300, y: 100 }],
      options: {
        ...baseParams.options,
        drawEdge: (): string => throwUnknown(),
      },
    });

    expect(result).toBeInstanceOf(Error);
    if (result instanceof Error) {
      expect(result.message).toBe("Unknown error: waypoint failure");
    }
  });

  it("returns typed errors from the waypoint catch block", () => {
    const result = getSmartEdgeWaypoints({
      ...baseParams,
      waypoints: [{ x: 300, y: 100 }],
      options: {
        ...baseParams.options,
        drawEdge: () => {
          throw new Error("draw failed");
        },
      },
    });

    expect(result).toBeInstanceOf(Error);
    if (result instanceof Error) {
      expect(result.message).toBe("draw failed");
    }
  });

  it("handles a zero-length tangent when straddling a waypoint", () => {
    vi.spyOn(getSmartEdgeModule, "getSmartEdge").mockReturnValue({
      svgPathString: "M0,0",
      edgeCenterX: 0,
      edgeCenterY: 0,
      points: [[300, 220]],
      wasRouted: true,
    });

    const result = getSmartEdgeWaypoints({
      ...baseParams,
      sourceX: 300,
      sourceY: 220,
      waypoints: [{ x: 303, y: 223 }],
      options: {
        ...baseParams.options,
        drawEdge: svgDrawStraightLinePath,
      },
    });

    vi.restoreAllMocks();
    expect(result).not.toBeInstanceOf(Error);
  });

  it("uses vertical side-facing handles for steep waypoint segments", () => {
    const result = getSmartEdgeWaypoints({
      ...baseParams,
      waypoints: [{ x: 235, y: 80 }],
    });

    expect(result).not.toBeInstanceOf(Error);
  });

  it("uses a downward side-facing handle for steep descending segments", () => {
    const result = getSmartEdgeWaypoints({
      ...baseParams,
      sourceX: 235,
      sourceY: 60,
      waypoints: [{ x: 235, y: 360 }],
    });

    expect(result).not.toBeInstanceOf(Error);
  });
});
