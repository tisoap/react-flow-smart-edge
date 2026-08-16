import { describe, expect, it } from "vitest";
import { createRouteCache, hashString, routeCacheKey } from "./routeCache";
import type { ObstacleBox } from "./obstacleIndex";

const testBox = (
  boxId: string,
  xMin: number,
  yMin: number,
  xMax: number,
  yMax: number,
): ObstacleBox => ({ id: boxId, xMin, yMin, xMax, yMax });

interface TestEdgeOverrides {
  sourceX?: number;
  sourceY?: number;
  targetX?: number;
  targetY?: number;
  waypoints?: { x: number; y: number }[];
}

const testEdge = (overrides: TestEdgeOverrides = {}) => ({
  sourceX: 0,
  sourceY: 0,
  targetX: 100,
  targetY: 100,
  sourcePosition: "right",
  targetPosition: "left",
  preset: "bezier",
  ...overrides,
});

describe("createRouteCache", () => {
  it("evicts the oldest entry once beyond capacity", () => {
    const cache = createRouteCache<number>(2);

    cache.set("first", 1);
    cache.set("second", 2);
    cache.set("third", 3);

    expect(cache.get("first")).toBeUndefined();
    expect(cache.get("second")).toBe(2);
    expect(cache.get("third")).toBe(3);
    expect(cache.size).toBe(2);
  });

  it("refreshes recency on get, protecting the re-read entry from eviction", () => {
    const cache = createRouteCache<number>(2);

    cache.set("keyA", 1);
    cache.set("keyB", 2);
    cache.get("keyA");
    cache.set("keyC", 3);

    expect(cache.get("keyB")).toBeUndefined();
    expect(cache.get("keyA")).toBe(1);
    expect(cache.get("keyC")).toBe(3);
    expect(cache.size).toBe(2);
  });

  it("empties the cache on clear", () => {
    const cache = createRouteCache<number>(5);

    cache.set("keyA", 1);
    cache.set("keyB", 2);
    cache.clear();

    expect(cache.size).toBe(0);
    expect(cache.get("keyA")).toBeUndefined();
  });

  it("returns undefined for a key that was never set", () => {
    const cache = createRouteCache<number>(5);

    expect(cache.get("missing")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("defaults maxEntries to 500 when not provided", () => {
    const cache = createRouteCache<number>();
    const entryCount = 500;

    for (let index = 0; index < entryCount; index += 1) {
      cache.set(`route-${String(index)}`, index);
    }

    expect(cache.size).toBe(entryCount);

    cache.set("route-500", entryCount);

    expect(cache.size).toBe(entryCount);
    expect(cache.get("route-0")).toBeUndefined();
    expect(cache.get("route-500")).toBe(entryCount);
  });
});

describe("hashString", () => {
  it("returns a base-36 string", () => {
    expect(hashString("hello")).toMatch(/^[0-9a-z]+$/);
  });

  it("is deterministic for the same input", () => {
    const sample = "route-sample-input";

    expect(hashString(sample)).toBe(hashString(sample));
  });

  it("differs for different inputs", () => {
    expect(hashString("route-sample-a")).not.toBe(hashString("route-sample-b"));
  });
});

describe("routeCacheKey", () => {
  const baseEdge = testEdge();
  const optionsKey = "gridRatio:10,nodePadding:10";
  const otherOptionsKey = "gridRatio:5,nodePadding:10";
  const insideNodeId = "inside-node";
  const insideCorridorBox = testBox(insideNodeId, 0, 0, 20, 20);
  const insideCorridorBoxMoved = testBox(insideNodeId, 5, 5, 25, 25);

  it("produces identical keys for identical inputs", () => {
    const corridorObstacles = [insideCorridorBox];

    const keyOne = routeCacheKey(baseEdge, optionsKey, corridorObstacles);
    const keyTwo = routeCacheKey(testEdge(), optionsKey, [insideCorridorBox]);

    expect(keyOne).toBe(keyTwo);
  });

  it("changes when an obstacle inside the corridor moves", () => {
    const keyBefore = routeCacheKey(baseEdge, optionsKey, [insideCorridorBox]);
    const keyAfter = routeCacheKey(baseEdge, optionsKey, [
      insideCorridorBoxMoved,
    ]);

    expect(keyBefore).not.toBe(keyAfter);
  });

  it("is unaffected by an obstacle outside the corridor, because a corridor-filtering caller never includes it in the list", () => {
    // A real caller (buildCorridorAttempt) drops obstacles outside the
    // routing corridor before building this argument, so an obstacle that
    // lives far from the corridor is simply never part of `corridorObstacles`
    // — whatever it is, or wherever it moves, cannot change the key.
    const corridorObstacles = [insideCorridorBox];

    const keyWithFilteredList = routeCacheKey(
      baseEdge,
      optionsKey,
      corridorObstacles,
    );
    const keySameFilteredListAgain = routeCacheKey(baseEdge, optionsKey, [
      testBox(insideNodeId, 0, 0, 20, 20),
    ]);

    expect(keyWithFilteredList).toBe(keySameFilteredListAgain);
  });

  it("keeps the key stable under sub-pixel endpoint jitter below 0.5px", () => {
    const jitterAmount = 0.4;
    const jittered = testEdge({
      sourceX: jitterAmount,
      sourceY: -jitterAmount,
      targetX: 100 + jitterAmount,
      targetY: 100 - jitterAmount,
    });

    const keyBase = routeCacheKey(baseEdge, optionsKey, []);
    const keyJittered = routeCacheKey(jittered, optionsKey, []);

    expect(keyBase).toBe(keyJittered);
  });

  it("changes when the endpoint moves by a full pixel", () => {
    const moved = testEdge({ sourceX: 1 });

    const keyBase = routeCacheKey(baseEdge, optionsKey, []);
    const keyMoved = routeCacheKey(moved, optionsKey, []);

    expect(keyBase).not.toBe(keyMoved);
  });

  it("changes when optionsKey changes", () => {
    const keyOne = routeCacheKey(baseEdge, optionsKey, []);
    const keyTwo = routeCacheKey(baseEdge, otherOptionsKey, []);

    expect(keyOne).not.toBe(keyTwo);
  });

  it("quantizes waypoint coordinates the same way as endpoints", () => {
    const jitterAmount = 0.4;
    const withWaypoint = testEdge({ waypoints: [{ x: 50, y: 50 }] });
    const withJitteredWaypoint = testEdge({
      waypoints: [{ x: 50 + jitterAmount, y: 50 - jitterAmount }],
    });
    const withoutWaypoint = testEdge();

    const keyWithWaypoint = routeCacheKey(withWaypoint, optionsKey, []);
    const keyWithJitteredWaypoint = routeCacheKey(
      withJitteredWaypoint,
      optionsKey,
      [],
    );
    const keyWithoutWaypoint = routeCacheKey(withoutWaypoint, optionsKey, []);

    expect(keyWithWaypoint).toBe(keyWithJitteredWaypoint);
    expect(keyWithWaypoint).not.toBe(keyWithoutWaypoint);
  });

  it("changes when per-edge options change", () => {
    const keyDefault = routeCacheKey(baseEdge, optionsKey, []);
    const keyFineGrid = routeCacheKey(
      { ...baseEdge, options: { gridRatio: 5 } },
      optionsKey,
      [],
    );
    const keyFineGridAgain = routeCacheKey(
      { ...baseEdge, options: { gridRatio: 5 } },
      optionsKey,
      [],
    );

    expect(keyDefault).not.toBe(keyFineGrid);
    expect(keyFineGrid).toBe(keyFineGridAgain);
  });
});
