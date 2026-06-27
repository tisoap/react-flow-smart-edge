import { Position } from "@xyflow/react";
import { describe, expect, it, beforeEach } from "vitest";
import { getSmartEdge } from "./index";
import {
  __resetSharedGridCache,
  __getSharedGridBuildCount,
} from "./sharedGridCache";
import {
  pathfindingAStarNoDiagonal,
  svgDrawStraightLinePath,
} from "../functions";
import type { Node } from "@xyflow/react";

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
  throw "routing exploded";
};

describe("getSmartEdge", () => {
  it("returns an SVG path and center for a simple edge", () => {
    const nodes = [testNode("source", 80, 200), testNode("target", 520, 200)];

    const result = getSmartEdge({
      nodes,
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
    });

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    expect(result.svgPathString).toMatch(/^M /);
    expect(result.svgPathString).toContain("L");
    expect(result.points.length).toBeGreaterThan(0);
    expect(Number.isFinite(result.edgeCenterX)).toBe(true);
    expect(Number.isFinite(result.edgeCenterY)).toBe(true);
  });

  it("routes around a consumer-provided avoid area", () => {
    const nodes = [testNode("source", 80, 200), testNode("target", 520, 200)];
    const avoidAreas = [{ x: 260, y: 120, width: 150, height: 170 }];

    const result = getSmartEdge({
      nodes,
      sourceX: 230,
      sourceY: 220,
      targetX: 520,
      targetY: 220,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {
        avoidAreas,
        gridRatio: 10,
        nodePadding: 10,
        drawEdge: svgDrawStraightLinePath,
        generatePath: pathfindingAStarNoDiagonal,
      },
    });

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    // A straight horizontal line would stay near y=220; routing around the
    // obstacle should introduce at least one point off that line.
    const deviatesFromDirectPath = result.points.some(
      ([, posY]) => Math.abs(posY - 220) > 5,
    );
    expect(deviatesFromDirectPath).toBe(true);
  });

  it("returns an Error when pathfinding fails", () => {
    const failingPathfinder = () => {
      throw new Error("No path found");
    };

    const result = getSmartEdge({
      nodes: [testNode("source", 0, 0), testNode("target", 200, 0)],
      sourceX: 50,
      sourceY: 20,
      targetX: 150,
      targetY: 20,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {
        generatePath: failingPathfinder,
      },
    });

    expect(result).toBeInstanceOf(Error);
    if (result instanceof Error) {
      expect(result.message).toBe("No path found");
    }
  });

  it("wraps unknown thrown values as errors", () => {
    const result = getSmartEdge({
      nodes: [testNode("source", 0, 0), testNode("target", 200, 0)],
      sourceX: 50,
      sourceY: 20,
      targetX: 150,
      targetY: 20,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {
        generatePath: (): number[][] => throwUnknown(),
      },
    });

    expect(result).toBeInstanceOf(Error);
    if (result instanceof Error) {
      expect(result.message).toBe("Unknown error: routing exploded");
    }
  });
});

describe("getSmartEdge shared grid cache", () => {
  beforeEach(() => {
    __resetSharedGridCache();
  });

  const nodes = [
    testNode("a", 0, 0),
    testNode("b", 400, 0),
    testNode("c", 0, 300),
    testNode("d", 400, 300),
  ];

  const baseOptions = {
    gridRatio: 10,
    nodePadding: 10,
    drawEdge: svgDrawStraightLinePath,
    generatePath: pathfindingAStarNoDiagonal,
  };

  const edge = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
  ) => ({
    nodes,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    options: baseOptions,
  });

  it("builds the grid once for many edges sharing nodes and options", () => {
    const edges = [
      edge(150, 20, 400, 20),
      edge(150, 320, 400, 320),
      edge(150, 20, 400, 320),
    ];

    const warm = edges.map((params) => getSmartEdge(params));

    expect(__getSharedGridBuildCount()).toBe(1);
    warm.forEach((result) => {
      expect(result).not.toBeInstanceOf(Error);
    });
  });

  it("produces identical output warm (cached) and cold (rebuilt)", () => {
    const edges = [
      edge(150, 20, 400, 20),
      edge(150, 320, 400, 320),
      edge(150, 20, 400, 320),
    ];

    const warm = edges.map((params) => getSmartEdge(params));

    edges.forEach((params, index) => {
      __resetSharedGridCache();
      const cold = getSmartEdge(params);
      expect(cold).toEqual(warm[index]);
    });
  });

  it("falls back to a per-edge grid when an endpoint is outside the bounds", () => {
    // The target sits far beyond every node, so it would have expanded the
    // graph box: the shared grid cannot be reused for this edge.
    const farEdge = edge(150, 20, 1000, 500);

    const result = getSmartEdge(farEdge);

    __resetSharedGridCache();
    const recomputed = getSmartEdge(farEdge);

    expect(result).not.toBeInstanceOf(Error);
    expect(result).toEqual(recomputed);
  });

  it("routes directly without a shared grid when there are no nodes", () => {
    const result = getSmartEdge({
      nodes: [],
      sourceX: 0,
      sourceY: 20,
      targetX: 200,
      targetY: 20,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: baseOptions,
    });

    expect(result).not.toBeInstanceOf(Error);
    expect(__getSharedGridBuildCount()).toBe(0);
  });
});
