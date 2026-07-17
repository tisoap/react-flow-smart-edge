import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import {
  buildObstacleBoxes,
  rectIntersectsBox,
  segmentIntersectsBox,
  isPolylineBlocked,
  nativeStepPolyline,
  isDirectPathBlocked,
} from "./obstacleIndex";
import type { Node, Rect } from "@xyflow/react";

const testNode = (
  nodeId: string,
  posX: number,
  posY: number,
  width = 100,
  height = 50,
): Node => ({
  id: nodeId,
  position: { x: posX, y: posY },
  measured: { width, height },
  data: {},
});

const testBox = (
  boxId: string,
  xMin: number,
  yMin: number,
  xMax: number,
  yMax: number,
) => ({ id: boxId, xMin, yMin, xMax, yMax });

describe("buildObstacleBoxes", () => {
  it("pads node boxes using the measured size floor, like getBoundingBoxes", () => {
    const nodes = [testNode("a", 100, 100, 40, 20)];

    const boxes = buildObstacleBoxes(nodes, 10);

    expect(boxes).toEqual([
      { id: "a", xMin: 90, yMin: 90, xMax: 150, yMax: 130 },
    ]);
  });

  it("floors missing measured dimensions to 1px, same as getBoundingBoxes", () => {
    const nodes: Node[] = [
      { id: "bare", position: { x: 10, y: 20 }, data: {} },
    ];

    const boxes = buildObstacleBoxes(nodes, 5);

    expect(boxes).toEqual([
      { id: "bare", xMin: 5, yMin: 15, xMax: 16, yMax: 26 },
    ]);
  });

  it("appends padded avoidAreas after node boxes, without grid rounding", () => {
    const nodes = [testNode("a", 0, 0, 10, 10)];
    const avoidAreas: Rect[] = [{ x: 50, y: 60, width: 20, height: 5 }];

    const boxes = buildObstacleBoxes(nodes, 4, avoidAreas);

    expect(boxes).toEqual([
      { id: "a", xMin: -4, yMin: -4, xMax: 14, yMax: 14 },
      { id: "avoid-0", xMin: 46, yMin: 56, xMax: 74, yMax: 69 },
    ]);
  });
});

describe("rectIntersectsBox", () => {
  const box = testBox("box", 100, 100, 200, 200);

  it("detects an overlapping rect", () => {
    expect(rectIntersectsBox(150, 150, 250, 250, box)).toBe(true);
  });

  it("detects a rect fully containing the box", () => {
    expect(rectIntersectsBox(0, 0, 300, 300, box)).toBe(true);
  });

  it("returns false for a rect that only touches the edge (no interior overlap)", () => {
    expect(rectIntersectsBox(200, 100, 300, 200, box)).toBe(false);
  });

  it("returns false for a rect entirely to one side", () => {
    expect(rectIntersectsBox(300, 300, 400, 400, box)).toBe(false);
  });
});

describe("segmentIntersectsBox", () => {
  const box = testBox("box", 100, 100, 200, 200);

  it("detects a segment fully inside the box", () => {
    expect(segmentIntersectsBox(120, 120, 180, 180, box)).toBe(true);
  });

  it("detects a segment entering and stopping inside the box", () => {
    expect(segmentIntersectsBox(0, 150, 150, 150, box)).toBe(true);
  });

  it("detects a segment starting inside and exiting the box", () => {
    expect(segmentIntersectsBox(150, 150, 300, 150, box)).toBe(true);
  });

  it("returns false for a segment fully outside the box (disjoint on one axis)", () => {
    expect(segmentIntersectsBox(0, 0, 50, 50, box)).toBe(false);
  });

  it("returns false for a segment that grazes past the box without crossing it", () => {
    expect(segmentIntersectsBox(0, 0, 300, 50, box)).toBe(false);
  });

  it("detects a vertical segment (dx=0) running inside the box's x-slab", () => {
    // Parallel to the y-axis, x stays within [xMin, xMax] the whole time.
    expect(segmentIntersectsBox(150, 0, 150, 300, box)).toBe(true);
  });

  it("misses a vertical segment (dx=0) running outside the box's x-slab", () => {
    expect(segmentIntersectsBox(50, 0, 50, 300, box)).toBe(false);
  });

  it("detects a horizontal segment (dy=0) running inside the box's y-slab", () => {
    // Parallel to the x-axis, y stays within [yMin, yMax] the whole time.
    expect(segmentIntersectsBox(0, 150, 300, 150, box)).toBe(true);
  });

  it("misses a horizontal segment (dy=0) running outside the box's y-slab", () => {
    expect(segmentIntersectsBox(0, 50, 300, 50, box)).toBe(false);
  });

  it("misses a diagonal segment whose y-axis clip rejects using the x-axis's tMin", () => {
    // The x-axis clips (run first) leave tMin around 0.1; this segment's
    // y-exit ratio lands below that, so clip3 rejects via the positive-p
    // "r < tMin" branch instead of the negative-p "r > tMax" branch already
    // covered above.
    expect(segmentIntersectsBox(0, 90, 1000, 0, box)).toBe(false);
  });
});

describe("isPolylineBlocked", () => {
  const boxes = [testBox("obstacle", 90, 90, 110, 110)];

  it("detects a blocked leg in a multi-segment polyline", () => {
    const points = [
      { x: 0, y: 100 },
      { x: 50, y: 100 },
      { x: 200, y: 100 },
    ];

    expect(isPolylineBlocked(points, boxes)).toBe(true);
  });

  it("returns false when no leg intersects any box", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
    ];

    expect(isPolylineBlocked(points, boxes)).toBe(false);
  });

  it("skips boxes whose id is in excludeIds", () => {
    const points = [
      { x: 0, y: 100 },
      { x: 200, y: 100 },
    ];

    expect(isPolylineBlocked(points, boxes, new Set(["obstacle"]))).toBe(false);
  });
});

describe("nativeStepPolyline", () => {
  it("splits at midX for right -> left (both horizontal)", () => {
    const points = nativeStepPolyline(
      0,
      0,
      Position.Right,
      100,
      50,
      Position.Left,
    );

    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 50 },
    ]);
  });

  it("splits at midY for bottom -> top (both vertical)", () => {
    const points = nativeStepPolyline(
      0,
      0,
      Position.Bottom,
      100,
      80,
      Position.Top,
    );

    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 40 },
      { x: 100, y: 40 },
      { x: 100, y: 80 },
    ]);
  });

  it("produces a single corner using target's x when source is horizontal (mixed)", () => {
    const points = nativeStepPolyline(
      0,
      0,
      Position.Right,
      100,
      80,
      Position.Top,
    );

    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 80 },
    ]);
  });

  it("produces a single corner using target's y when source is vertical (mixed)", () => {
    const points = nativeStepPolyline(
      0,
      0,
      Position.Bottom,
      100,
      80,
      Position.Left,
    );

    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 80 },
      { x: 100, y: 80 },
    ]);
  });
});

describe("isDirectPathBlocked", () => {
  it("returns true when a straight line between the points crosses a padded node", () => {
    const blocker = testNode("blocker", 90, 40, 20, 20);

    const blocked = isDirectPathBlocked({ x: 0, y: 50 }, { x: 200, y: 50 }, [
      blocker,
    ]);

    expect(blocked).toBe(true);
  });

  it("returns false when no node sits between the points", () => {
    const farNode = testNode("far", 1000, 1000, 20, 20);

    const blocked = isDirectPathBlocked({ x: 0, y: 0 }, { x: 100, y: 0 }, [
      farNode,
    ]);

    expect(blocked).toBe(false);
  });

  it("is blocked by the endpoint-owning nodes' own padded boxes unless excluded", () => {
    // Source/target sit inside their own node's padded box (as a real edge
    // handle would); without exclusion that alone counts as blocked.
    const nodes = [
      testNode("source-node", 0, 0, 20, 20),
      testNode("target-node", 200, 0, 20, 20),
    ];
    const source = { x: 10, y: 10 };
    const target = { x: 210, y: 10 };

    expect(isDirectPathBlocked(source, target, nodes)).toBe(true);
    expect(
      isDirectPathBlocked(source, target, nodes, {
        excludeNodeIds: ["source-node", "target-node"],
      }),
    ).toBe(false);
  });

  it("honors a custom nodePadding and avoidAreas", () => {
    const blocked = isDirectPathBlocked(
      { x: 0, y: 500 },
      { x: 100, y: 500 },
      [],
      {
        avoidAreas: [{ x: 40, y: 495, width: 20, height: 10 }],
        nodePadding: 1,
      },
    );

    expect(blocked).toBe(true);
  });
});
