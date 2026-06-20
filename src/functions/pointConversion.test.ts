import { describe, expect, it } from "vitest";
import { graphToGridPoint, gridToGraphPoint } from "./pointConversion";

describe("pointConversion", () => {
  const smallestX = 100;
  const smallestY = 50;
  const gridRatio = 10;

  it("converts graph points to grid coordinates with a one-cell border", () => {
    expect(
      graphToGridPoint({ x: 100, y: 50 }, smallestX, smallestY, gridRatio),
    ).toEqual({
      x: 1,
      y: 1,
    });
    expect(
      graphToGridPoint({ x: 120, y: 80 }, smallestX, smallestY, gridRatio),
    ).toEqual({
      x: 3,
      y: 4,
    });
  });

  it("round-trips graph ↔ grid coordinates", () => {
    const graphPoint = { x: 237, y: 183 };
    const gridPoint = graphToGridPoint(
      graphPoint,
      smallestX,
      smallestY,
      gridRatio,
    );
    expect(
      gridToGraphPoint(gridPoint, smallestX, smallestY, gridRatio),
    ).toEqual(graphPoint);
  });
});
