import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import {
  getEdgePosition,
  getFloatingEdgeParams,
  getNodeIntersection,
} from "./getFloatingEdgeParams";
import type { Node } from "@xyflow/react";

const node = (
  id: string,
  x: number,
  y: number,
  width?: number,
  height?: number,
): Node => ({
  id,
  position: { x, y },
  measured: width === undefined ? undefined : { width, height: height ?? width },
  data: {},
});

describe("getFloatingEdgeParams", () => {
  it("computes border intersections and handle sides between two nodes", () => {
    const source = node("s", 0, 100, 80, 40);
    const target = node("t", 300, 100, 80, 40);

    const params = getFloatingEdgeParams(source, target);

    expect(params.sourcePos).toBe(Position.Right);
    expect(params.targetPos).toBe(Position.Left);
    expect(params.sx).toBeGreaterThan(source.position.x);
    expect(params.tx).toBeLessThanOrEqual(target.position.x + 80);
  });

  it("defaults missing measured dimensions to 1x1 nodes", () => {
    const source = node("s", 0, 0);
    const target = node("t", 50, 0);

    expect(getFloatingEdgeParams(source, target)).toMatchObject({
      sx: expect.any(Number),
      sy: expect.any(Number),
      tx: expect.any(Number),
      ty: expect.any(Number),
    });
  });

  it("handles coincident node centers without dividing by zero", () => {
    const a = node("a", 0, 0, 20, 20);
    const b = node("b", 0, 0, 20, 20);

    expect(getNodeIntersection(a, b)).toEqual({ x: 10, y: 10 });
  });

  it.each([
    [Position.Left, { x: 0, y: 50 }],
    [Position.Right, { x: 99, y: 50 }],
    [Position.Top, { x: 50, y: 0 }],
    [Position.Bottom, { x: 50, y: 99 }],
    [Position.Top, { x: 50, y: 50 }],
  ] as const)("maps %s for an intersection near the border", (expected, point) => {
    const rect = node("n", 0, 0, 100, 100);
    expect(getEdgePosition(rect, point)).toBe(expected);
  });
});
