import { describe, expect, it } from "vitest";
import { computeEdgeHops, toPolyline } from "./edgeHops";
import { drawOrthogonalHopPath } from "./drawHopPath";
import type { XYPosition } from "@xyflow/react";

const horizontal: XYPosition[] = [
  { x: 0, y: 100 },
  { x: 400, y: 100 },
];

const vertical: XYPosition[] = [
  { x: 200, y: 0 },
  { x: 200, y: 300 },
];

describe("computeEdgeHops", () => {
  it("detects a perpendicular crossing on the horizontal segment", () => {
    const hops = computeEdgeHops(horizontal, [vertical]);
    expect(hops).toEqual([{ segmentIndex: 0, at: 200 }]);
  });

  it("detects a perpendicular crossing on the vertical segment", () => {
    const hops = computeEdgeHops(vertical, [horizontal]);
    expect(hops).toEqual([{ segmentIndex: 0, at: 100 }]);
  });

  it("ignores collinear / non-crossing segments", () => {
    const parallel: XYPosition[] = [
      { x: 0, y: 200 },
      { x: 400, y: 200 },
    ];
    expect(computeEdgeHops(horizontal, [parallel])).toEqual([]);
  });

  it("ignores T-junctions that only touch a segment endpoint", () => {
    const touching: XYPosition[] = [
      { x: 0, y: 100 },
      { x: 0, y: 300 },
    ];
    expect(computeEdgeHops(horizontal, [touching])).toEqual([]);
  });

  it("skips diagonal segments", () => {
    const diagonal: XYPosition[] = [
      { x: 0, y: 0 },
      { x: 400, y: 300 },
    ];
    expect(computeEdgeHops(diagonal, [vertical])).toEqual([]);
  });

  it("does not hop a vertical segment that misses every horizontal", () => {
    const farHorizontal: XYPosition[] = [
      { x: 0, y: 500 },
      { x: 400, y: 500 },
    ];
    expect(computeEdgeHops(vertical, [farHorizontal])).toEqual([]);
  });

  it("ignores a zero-length other segment", () => {
    const degenerate: XYPosition[] = [
      { x: 200, y: 100 },
      { x: 200, y: 100 },
    ];
    expect(computeEdgeHops(horizontal, [degenerate])).toEqual([]);
  });
});

describe("toPolyline", () => {
  it("prepends source, appends target, and dedupes", () => {
    const polyline = toPolyline({ x: 0, y: 0 }, { x: 10, y: 10 }, [
      [0, 0],
      [5, 0],
      [5, 0],
    ]);
    expect(polyline).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 10 },
    ]);
  });

  it("merges collinear midpoints into a single segment", () => {
    const polyline = toPolyline({ x: 0, y: 0 }, { x: 0, y: 300 }, [
      [0, 50],
      [0, 170],
      [0, 240],
    ]);
    expect(polyline).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 300 },
    ]);
  });

  it("detects a crossing that lands on a former collinear vertex", () => {
    // The vertical edge has a routed vertex exactly at the crossing height.
    const myHorizontal = toPolyline({ x: 0, y: 170 }, { x: 400, y: 170 }, []);
    const otherVertical = toPolyline({ x: 200, y: 0 }, { x: 200, y: 300 }, [
      [200, 170],
    ]);
    expect(computeEdgeHops(myHorizontal, [otherVertical])).toEqual([
      { segmentIndex: 0, at: 200 },
    ]);
  });
});

describe("drawOrthogonalHopPath", () => {
  it("returns empty string for an empty polyline", () => {
    expect(drawOrthogonalHopPath([], [])).toBe("");
  });

  it("draws a plain step path when there are no hops", () => {
    const path = drawOrthogonalHopPath(horizontal, []);
    expect(path).not.toMatch(/A /);
    expect(path).toMatch(/^M /);
  });

  it("draws an arc bridge at a crossing", () => {
    const hops = computeEdgeHops(horizontal, [vertical]);
    const path = drawOrthogonalHopPath(horizontal, hops, { hopRadius: 6 });
    expect(path).toMatch(/A 6 6 0 0 \d/);
  });

  it("draws an arc bridge on a vertical segment", () => {
    const hops = computeEdgeHops(vertical, [horizontal]);
    const path = drawOrthogonalHopPath(vertical, hops, { hopRadius: 6 });
    expect(path).toMatch(/A 6 6 0 0 \d/);
  });

  it("rounds corners when borderRadius is set", () => {
    const elbow: XYPosition[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];
    const path = drawOrthogonalHopPath(elbow, [], { borderRadius: 10 });
    expect(path).toMatch(/Q /);
  });

  it("skips a hop that sits too close to the start corner", () => {
    // Crossing at x=3 on a segment starting at x=0 cannot fit a radius-6 arc.
    const tightVertical: XYPosition[] = [
      { x: 3, y: 0 },
      { x: 3, y: 300 },
    ];
    const hops = computeEdgeHops(horizontal, [tightVertical]);
    expect(hops).toHaveLength(1);
    const path = drawOrthogonalHopPath(horizontal, hops, { hopRadius: 6 });
    expect(path).not.toMatch(/A /);
  });

  it("skips a hop that sits too close to the end corner", () => {
    // Crossing at x=398 on a segment ending at x=400 cannot fit a radius-6 arc.
    const tightVertical: XYPosition[] = [
      { x: 398, y: 0 },
      { x: 398, y: 300 },
    ];
    const hops = computeEdgeHops(horizontal, [tightVertical]);
    expect(hops).toHaveLength(1);
    const path = drawOrthogonalHopPath(horizontal, hops, { hopRadius: 6 });
    expect(path).not.toMatch(/A /);
  });

  it("draws multiple sorted bridges on one segment", () => {
    const verticalA: XYPosition[] = [
      { x: 100, y: 0 },
      { x: 100, y: 300 },
    ];
    const verticalB: XYPosition[] = [
      { x: 300, y: 0 },
      { x: 300, y: 300 },
    ];
    const hops = computeEdgeHops(horizontal, [verticalB, verticalA]);
    const path = drawOrthogonalHopPath(horizontal, hops, { hopRadius: 6 });
    expect([...path.matchAll(/A /g)]).toHaveLength(2);
  });

  it("draws bridges on reversed (right-to-left, bottom-to-top) segments", () => {
    const reversedHorizontal: XYPosition[] = [
      { x: 400, y: 100 },
      { x: 0, y: 100 },
    ];
    const reversedVertical: XYPosition[] = [
      { x: 100, y: 300 },
      { x: 100, y: 0 },
    ];
    expect(
      drawOrthogonalHopPath(
        reversedHorizontal,
        computeEdgeHops(reversedHorizontal, [vertical]),
        { hopRadius: 6 },
      ),
    ).toMatch(/A /);
    expect(
      drawOrthogonalHopPath(
        reversedVertical,
        computeEdgeHops(reversedVertical, [horizontal]),
        { hopRadius: 6 },
      ),
    ).toMatch(/A /);
  });

  it("treats collinear midpoints as straight when rounding corners", () => {
    const withCollinear: XYPosition[] = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];
    const path = drawOrthogonalHopPath(withCollinear, [], { borderRadius: 10 });
    expect(path).toMatch(/Q /);
  });
});
