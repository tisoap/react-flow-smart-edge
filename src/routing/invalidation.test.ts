import { describe, expect, it } from "vitest";
import {
  snapshotNodes,
  diffNodeSnapshots,
  corridorTouchesRects,
} from "./invalidation";
import type { NodeSnapshot } from "./invalidation";
import type { Node } from "@xyflow/react";

const testSnapshot = (
  nodeId: string,
  posX: number,
  posY: number,
  width = 100,
  height = 50,
  dragging = false,
  selected = false,
): NodeSnapshot => ({
  id: nodeId,
  x: posX,
  y: posY,
  width,
  height,
  dragging,
  selected,
});

describe("snapshotNodes", () => {
  it("reads position, measured size, dragging, and selected verbatim", () => {
    const node: Node = {
      id: "alpha",
      position: { x: 12, y: 34 },
      measured: { width: 56, height: 78 },
      dragging: true,
      selected: true,
      data: {},
    };

    expect(snapshotNodes([node])).toEqual([
      testSnapshot("alpha", 12, 34, 56, 78, true, true),
    ]);
  });

  it("floors missing measured dimensions to 1px, like getBoundingBoxes", () => {
    const node: Node = { id: "bare", position: { x: 1, y: 2 }, data: {} };

    expect(snapshotNodes([node])).toEqual([
      testSnapshot("bare", 1, 2, 1, 1, false, false),
    ]);
  });

  it("defaults dragging and selected to false when undefined", () => {
    const node: Node = {
      id: "plain",
      position: { x: 0, y: 0 },
      measured: { width: 10, height: 10 },
      data: {},
    };

    const [snapshot] = snapshotNodes([node]);

    expect(snapshot.dragging).toBe(false);
    expect(snapshot.selected).toBe(false);
  });
});

describe("diffNodeSnapshots", () => {
  it("reports no change and empty rects when nothing differs", () => {
    const prev = [testSnapshot("a", 100, 100, 40, 20)];
    const next = [testSnapshot("a", 100, 100, 40, 20)];

    const diff = diffNodeSnapshots(prev, next, 10);

    expect(diff.changed).toBe(false);
    expect(diff.changedRects).toEqual([]);
    expect(diff.draggingNodeIds).toEqual(new Set());
    expect(diff.selectedNodeIds).toEqual(new Set());
  });

  it("contributes both the old and new padded rects for a moved node", () => {
    const prev = [testSnapshot("a", 100, 100, 40, 20)];
    const next = [testSnapshot("a", 150, 100, 40, 20)];

    const diff = diffNodeSnapshots(prev, next, 10);

    expect(diff.changed).toBe(true);
    expect(diff.changedRects).toEqual([
      { xMin: 90, yMin: 90, xMax: 150, yMax: 130 },
      { xMin: 140, yMin: 90, xMax: 200, yMax: 130 },
    ]);
  });

  it("contributes both the old and new padded rects for a resized node", () => {
    const prev = [testSnapshot("a", 0, 0, 40, 20)];
    const next = [testSnapshot("a", 0, 0, 60, 20)];

    const diff = diffNodeSnapshots(prev, next, 5);

    expect(diff.changed).toBe(true);
    expect(diff.changedRects).toEqual([
      { xMin: -5, yMin: -5, xMax: 45, yMax: 25 },
      { xMin: -5, yMin: -5, xMax: 65, yMax: 25 },
    ]);
  });

  it("contributes a single padded rect for an added node", () => {
    const prev: NodeSnapshot[] = [];
    const next = [testSnapshot("new", 10, 20, 30, 40)];

    const diff = diffNodeSnapshots(prev, next, 2);

    expect(diff.changed).toBe(true);
    expect(diff.changedRects).toEqual([
      { xMin: 8, yMin: 18, xMax: 42, yMax: 62 },
    ]);
  });

  it("contributes a single padded rect for a removed node", () => {
    const prev = [testSnapshot("gone", 10, 20, 30, 40)];
    const next: NodeSnapshot[] = [];

    const diff = diffNodeSnapshots(prev, next, 2);

    expect(diff.changed).toBe(true);
    expect(diff.changedRects).toEqual([
      { xMin: 8, yMin: 18, xMax: 42, yMax: 62 },
    ]);
  });

  it("derives dragging/selected sets from next regardless of change status", () => {
    const prev = [
      testSnapshot("unchanged", 0, 0, 10, 10, false, false),
      testSnapshot("moved", 0, 0, 10, 10, false, false),
    ];
    const next = [
      testSnapshot("unchanged", 0, 0, 10, 10, true, true),
      testSnapshot("moved", 100, 0, 10, 10, false, true),
    ];

    const diff = diffNodeSnapshots(prev, next, 5);

    expect(diff.draggingNodeIds).toEqual(new Set(["unchanged"]));
    expect(diff.selectedNodeIds).toEqual(new Set(["unchanged", "moved"]));
  });

  it("combines unchanged, moved, added, and removed nodes in one diff", () => {
    const prev = [
      testSnapshot("stays", 0, 0, 10, 10),
      testSnapshot("moves", 0, 0, 10, 10),
      testSnapshot("removed", 500, 500, 10, 10),
    ];
    const next = [
      testSnapshot("stays", 0, 0, 10, 10),
      testSnapshot("moves", 20, 0, 10, 10),
      testSnapshot("added", 900, 900, 10, 10),
    ];

    const diff = diffNodeSnapshots(prev, next, 1);

    expect(diff.changed).toBe(true);
    // "moves" old + new, "removed" old, "added" new (order: prev-side pass
    // then next-side pass) — "stays" contributes nothing.
    expect(diff.changedRects).toEqual([
      { xMin: -1, yMin: -1, xMax: 11, yMax: 11 },
      { xMin: 19, yMin: -1, xMax: 31, yMax: 11 },
      { xMin: 499, yMin: 499, xMax: 511, yMax: 511 },
      { xMin: 899, yMin: 899, xMax: 911, yMax: 911 },
    ]);
  });
});

describe("corridorTouchesRects", () => {
  const corridor = { xMin: 100, yMin: 100, xMax: 200, yMax: 200 };

  it("returns true when a rect overlaps the corridor", () => {
    const rects = [{ xMin: 150, yMin: 150, xMax: 250, yMax: 250 }];

    expect(corridorTouchesRects(corridor, rects)).toBe(true);
  });

  it("returns false when every rect is disjoint from the corridor", () => {
    const rects = [
      { xMin: 300, yMin: 300, xMax: 400, yMax: 400 },
      { xMin: -100, yMin: -100, xMax: -50, yMax: -50 },
    ];

    expect(corridorTouchesRects(corridor, rects)).toBe(false);
  });

  it("returns false for a rect that only touches the corridor's edge", () => {
    const rects = [{ xMin: 200, yMin: 100, xMax: 300, yMax: 200 }];

    expect(corridorTouchesRects(corridor, rects)).toBe(false);
  });

  it("returns false for an empty rect list", () => {
    expect(corridorTouchesRects(corridor, [])).toBe(false);
  });

  it("returns true when a later rect overlaps even if an earlier one doesn't", () => {
    const rects = [
      { xMin: 300, yMin: 300, xMax: 400, yMax: 400 },
      { xMin: 150, yMin: 150, xMax: 250, yMax: 250 },
    ];

    expect(corridorTouchesRects(corridor, rects)).toBe(true);
  });
});
