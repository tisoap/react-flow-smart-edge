import { describe, expect, it, beforeEach } from "vitest";
import {
  getSharedGrid,
  isWithinSharedBounds,
  __resetSharedGridCache,
  __getSharedGridBuildCount,
} from "./sharedGridCache";
import type { Node, Rect } from "@xyflow/react";

const testNode = (nodeId: string, posX: number, posY: number): Node => ({
  id: nodeId,
  position: { x: posX, y: posY },
  measured: { width: 100, height: 50 },
  data: {},
});

const unmeasuredNode = (nodeId: string, posX: number, posY: number): Node => ({
  id: nodeId,
  position: { x: posX, y: posY },
  data: {},
});

describe("getSharedGrid", () => {
  beforeEach(() => {
    __resetSharedGridCache();
  });

  it("returns null when there are no obstacles at all", () => {
    expect(getSharedGrid([], 10, 10, [])).toBeNull();
    expect(__getSharedGridBuildCount()).toBe(0);
  });

  it("builds from avoid areas even with no nodes", () => {
    const avoidAreas: Rect[] = [{ x: 0, y: 0, width: 100, height: 100 }];

    const shared = getSharedGrid([], 10, 10, avoidAreas);

    expect(shared).not.toBeNull();
    expect(__getSharedGridBuildCount()).toBe(1);
  });

  it("builds once and reuses the entry for the same inputs", () => {
    const nodes = [testNode("a", 100, 100), testNode("b", 400, 100)];

    getSharedGrid(nodes, 10, 10, []);
    getSharedGrid(nodes, 10, 10, []);
    getSharedGrid(nodes, 10, 10, []);

    expect(__getSharedGridBuildCount()).toBe(1);
  });

  it("handles nodes with and without measured sizes in its signature", () => {
    const withMeasured = [testNode("a", 100, 100)];
    const withoutMeasured = [unmeasuredNode("a", 100, 100)];

    getSharedGrid(withMeasured, 10, 10, []);
    getSharedGrid(withoutMeasured, 10, 10, []);

    // Different measured sizes must produce different signatures (two builds).
    expect(__getSharedGridBuildCount()).toBe(2);
  });

  it("rebuilds when a node moves", () => {
    getSharedGrid([testNode("a", 100, 100)], 10, 10, []);
    getSharedGrid([testNode("a", 120, 100)], 10, 10, []);

    expect(__getSharedGridBuildCount()).toBe(2);
  });

  it("evicts everything once the cache is full", () => {
    // Fill the cache up to its capacity (8 distinct signatures).
    for (let index = 0; index < 8; index++) {
      getSharedGrid([testNode("a", index * 1000, 0)], 10, 10, []);
    }
    expect(__getSharedGridBuildCount()).toBe(8);

    // The first signature is still cached at capacity (no rebuild).
    getSharedGrid([testNode("a", 0, 0)], 10, 10, []);
    expect(__getSharedGridBuildCount()).toBe(8);

    // A ninth distinct signature overflows the cache and clears it.
    getSharedGrid([testNode("a", 9000, 0)], 10, 10, []);
    expect(__getSharedGridBuildCount()).toBe(9);

    // The earlier entry was dropped, so it must rebuild.
    getSharedGrid([testNode("a", 0, 0)], 10, 10, []);
    expect(__getSharedGridBuildCount()).toBe(10);
  });
});

describe("isWithinSharedBounds", () => {
  beforeEach(() => {
    __resetSharedGridCache();
  });

  // Node at (100,100) sized 100x50 with padding 10 / ratio 10 yields obstacle
  // bounds of x:[90,210], y:[90,160].
  const buildShared = () => {
    const shared = getSharedGrid([testNode("a", 100, 100)], 10, 10, []);
    if (!shared) throw new Error("expected a shared grid");
    return shared;
  };

  it("is true when every point falls inside the obstacle bounds", () => {
    const shared = buildShared();
    expect(
      isWithinSharedBounds(shared, [
        { x: 100, y: 100 },
        { x: 200, y: 150 },
      ]),
    ).toBe(true);
  });

  it("is false when a point is left of the bounds", () => {
    const shared = buildShared();
    expect(isWithinSharedBounds(shared, [{ x: 50, y: 100 }])).toBe(false);
  });

  it("is false when a point is right of the bounds", () => {
    const shared = buildShared();
    expect(isWithinSharedBounds(shared, [{ x: 300, y: 100 }])).toBe(false);
  });

  it("is false when a point is above the bounds", () => {
    const shared = buildShared();
    expect(isWithinSharedBounds(shared, [{ x: 100, y: 50 }])).toBe(false);
  });

  it("is false when a point is below the bounds", () => {
    const shared = buildShared();
    expect(isWithinSharedBounds(shared, [{ x: 100, y: 300 }])).toBe(false);
  });
});
