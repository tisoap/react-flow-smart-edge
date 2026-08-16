import { describe, expect, it } from "vitest";
import {
  buildControlPoints,
  pointAlongPolyline,
  splitPolylineAtWaypoints,
} from "./controlPointGeometry";

describe("pointAlongPolyline", () => {
  it("returns the default origin for an empty polyline", () => {
    expect(pointAlongPolyline([], 0.5)).toEqual({ x: 0, y: 0 });
  });

  it("returns the sole point for a one-point polyline", () => {
    expect(pointAlongPolyline([[12, 34]], 0.5)).toEqual({ x: 12, y: 34 });
  });

  it("interpolates along a multi-point polyline", () => {
    expect(
      pointAlongPolyline(
        [
          [0, 0],
          [10, 0],
        ],
        0.5,
      ),
    ).toEqual({
      x: 5,
      y: 0,
    });
  });

  it("returns the terminal point when the target distance exceeds the path", () => {
    expect(
      pointAlongPolyline(
        [
          [0, 0],
          [10, 0],
        ],
        1.5,
      ),
    ).toEqual({
      x: 10,
      y: 0,
    });
  });
});

describe("pointAlongPolyline zero-length segments", () => {
  it("treats a zero-length segment at the target distance as its endpoint", () => {
    expect(
      pointAlongPolyline(
        [
          [0, 0],
          [0, 0],
          [10, 0],
        ],
        0,
      ),
    ).toEqual({ x: 0, y: 0 });
  });
});

describe("splitPolylineAtWaypoints", () => {
  it("returns a single empty segment for an empty polyline", () => {
    expect(splitPolylineAtWaypoints([], [])).toEqual([[]]);
  });

  it("returns the whole polyline as one segment when there are no waypoints", () => {
    const polyline = [
      [0, 0],
      [10, 0],
    ];
    expect(splitPolylineAtWaypoints(polyline, [])).toEqual([polyline]);
  });
});

describe("buildControlPoints", () => {
  it("interleaves inactive midpoints with active waypoints", () => {
    const points = buildControlPoints(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      [{ id: "wp-1", x: 50, y: 0, active: true }],
      [],
    );

    expect(points).toHaveLength(3);
    expect(points[0]).toMatchObject({ active: false });
    expect(points[1]).toMatchObject({ id: "wp-1", active: true });
    expect(points[2]).toMatchObject({ active: false });
  });
});
