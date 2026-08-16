import { describe, expect, it } from "vitest";
import { readControlPoints, readCheckpoints } from "./smartEdgeData";

describe("readControlPoints", () => {
  it("returns the active waypoints from valid data", () => {
    const points = [{ id: "wp-1", x: 10, y: 20, active: true }];
    expect(readControlPoints({ points })).toEqual(points);
  });

  it("returns an empty list when data is not a record", () => {
    expect(readControlPoints(null)).toEqual([]);
    expect(readControlPoints("nope")).toEqual([]);
  });

  it("returns an empty list when the points field is missing", () => {
    expect(readControlPoints({ other: 1 })).toEqual([]);
  });

  it("returns an empty list when points is not an array", () => {
    expect(readControlPoints({ points: "not-an-array" })).toEqual([]);
  });

  it("rejects arrays whose elements are malformed control points", () => {
    expect(readControlPoints({ points: [{ id: "wp-1", x: 10 }] })).toEqual([]);
    expect(readControlPoints({ points: [{ id: 5, x: 10, y: 20 }] })).toEqual(
      [],
    );
    expect(
      readControlPoints({ points: [{ id: "wp", x: "10", y: 20 }] }),
    ).toEqual([]);
    expect(readControlPoints({ points: ["not-an-object"] })).toEqual([]);
  });
});

describe("readCheckpoints", () => {
  it("returns valid checkpoints and drops malformed ones", () => {
    expect(
      readCheckpoints({
        checkpoints: [
          { x: 1, y: 2 },
          { x: "bad", y: 2 },
        ],
      }),
    ).toEqual([{ x: 1, y: 2 }]);
  });

  it("returns an empty list when data is not a record", () => {
    expect(readCheckpoints(42)).toEqual([]);
  });

  it("returns an empty list when the checkpoints field is missing", () => {
    expect(readCheckpoints({ other: 1 })).toEqual([]);
  });

  it("returns an empty list when checkpoints is not an array", () => {
    expect(readCheckpoints({ checkpoints: "nope" })).toEqual([]);
  });
});
