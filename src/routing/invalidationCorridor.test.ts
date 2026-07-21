import { describe, expect, it } from "vitest";
import {
  boundsOfPolyline,
  filterObstaclesInCorridor,
  obstaclesSignatureOf,
} from "./invalidationCorridor";
import type { ObstacleBox } from "./obstacleIndex";

describe("boundsOfPolyline", () => {
  it("returns the min/max bounds of the points inflated by pad on every side", () => {
    const rect = boundsOfPolyline(
      [
        { x: 10, y: 20 },
        { x: 50, y: -5 },
        { x: 30, y: 100 },
      ],
      5,
    );

    expect(rect).toEqual({ xMin: 5, yMin: -10, xMax: 55, yMax: 105 });
  });

  it("collapses to a single inflated point for a single-point polyline", () => {
    const rect = boundsOfPolyline([{ x: 10, y: 10 }], 2);

    expect(rect).toEqual({ xMin: 8, yMin: 8, xMax: 12, yMax: 12 });
  });
});

describe("filterObstaclesInCorridor", () => {
  const boxes: ObstacleBox[] = [
    { id: "inside", xMin: 0, yMin: 0, xMax: 10, yMax: 10 },
    { id: "outside", xMin: 100, yMin: 100, xMax: 110, yMax: 110 },
    { id: "touching-edge", xMin: 10, yMin: 10, xMax: 20, yMax: 20 },
  ];

  it("keeps only the boxes whose rect overlaps the corridor's interior", () => {
    const result = filterObstaclesInCorridor(
      { xMin: 0, yMin: 0, xMax: 10, yMax: 10 },
      boxes,
    );

    expect(result.map((box) => box.id)).toEqual(["inside"]);
  });

  it("returns an empty list when nothing overlaps", () => {
    const result = filterObstaclesInCorridor(
      { xMin: 500, yMin: 500, xMax: 600, yMax: 600 },
      boxes,
    );

    expect(result).toEqual([]);
  });
});

describe("obstaclesSignatureOf", () => {
  it("produces identical signatures for identical obstacle lists", () => {
    const boxesA: ObstacleBox[] = [
      { id: "n1", xMin: 0, yMin: 0, xMax: 10, yMax: 10 },
    ];
    const boxesB: ObstacleBox[] = [
      { id: "n1", xMin: 0, yMin: 0, xMax: 10, yMax: 10 },
    ];

    expect(obstaclesSignatureOf(boxesA)).toEqual(obstaclesSignatureOf(boxesB));
  });

  it("produces a different signature when a box's rect differs", () => {
    const original: ObstacleBox[] = [
      { id: "n1", xMin: 0, yMin: 0, xMax: 10, yMax: 10 },
    ];
    const moved: ObstacleBox[] = [
      { id: "n1", xMin: 1, yMin: 0, xMax: 10, yMax: 10 },
    ];

    expect(obstaclesSignatureOf(original)).not.toEqual(
      obstaclesSignatureOf(moved),
    );
  });

  it("returns an empty string for an empty obstacle list", () => {
    expect(obstaclesSignatureOf([])).toEqual("");
  });
});
