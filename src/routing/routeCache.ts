import type { ObstacleBox } from "./obstacleIndex";

/** A generic least-recently-used cache keyed by string. `get` marks its key
 * as most recently used; `set` evicts the single oldest (least recently
 * used) entry once the cache holds more than `maxEntries`. Kept free of any
 * routing-result type so it can be shared before that type exists. */
export interface RouteCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  clear(): void;
  readonly size: number;
}

const DEFAULT_MAX_ENTRIES = 500;

/**
 * Creates an LRU cache backed by a `Map` (whose keys iterate in insertion
 * order): `get` re-inserts its key so it sorts last, and `set` reads the
 * map's first key back out once capacity is exceeded to evict it.
 */
export const createRouteCache = <T>(
  maxEntries: number = DEFAULT_MAX_ENTRIES,
): RouteCache<T> => {
  const store = new Map<string, T>();

  return {
    get(key) {
      const value = store.get(key);
      if (value === undefined) return undefined;

      store.delete(key);
      store.set(key, value);
      return value;
    },
    set(key, value) {
      store.delete(key);
      store.set(key, value);

      if (store.size <= maxEntries) return;
      const [oldestKey] = store.keys();
      store.delete(oldestKey);
    },
    clear() {
      store.clear();
    },
    get size() {
      return store.size;
    },
  };
};

/**
 * djb2 string hash, returned as a base-36 string. Used to compress the
 * corridor's obstacle list into a short, stable cache-key segment instead of
 * hashing the raw obstacle data on every lookup.
 */
export const hashString = (input: string): string => {
  let hash = 5381;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) | 0;
  }

  return (hash >>> 0).toString(36);
};

/** The subset of a routed edge's props that determine its route. Typed
 * locally (rather than imported from `@xyflow/react`) to keep this module
 * dependency-light. */
interface RouteCacheEdge {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: string;
  targetPosition: string;
  preset: string;
  waypoints?: { x: number; y: number }[];
  options?: {
    gridRatio?: number;
    nodePadding?: number;
    avoidAreas?: { x: number; y: number; width: number; height: number }[];
    borderRadius?: number;
  };
}

const quantize = (value: number): number => Math.round(value);

const obstacleKeyPart = (box: ObstacleBox): string =>
  [box.id, box.xMin, box.yMin, box.xMax, box.yMax].join(",");

const waypointKeyPart = (point: { x: number; y: number }): string =>
  `${String(quantize(point.x))}:${String(quantize(point.y))}`;

/**
 * Builds a route-cache key for one edge. Endpoint and waypoint coordinates
 * are quantized with `Math.round` so sub-pixel layout jitter still hits the
 * cache, while the corridor's obstacle list is hashed so any change to the
 * *local* obstacle set (an added, removed, or moved node) busts it.
 * Per-edge options (`gridRatio`, `nodePadding`, `avoidAreas`, `borderRadius`)
 * are serialized so `createSmartEdge(..., { gridRatio: 5 })` cannot reuse a
 * path computed under different overrides. `corridorObstacles` is expected
 * to already be filtered to the routing corridor by the caller — an obstacle
 * outside it is simply absent from the list and cannot affect the key.
 */
export const routeCacheKey = (
  edge: RouteCacheEdge,
  optionsKey: string,
  corridorObstacles: ObstacleBox[],
): string => {
  const waypointsKey = (edge.waypoints ?? []).map(waypointKeyPart).join(";");
  const obstaclesKey = hashString(
    corridorObstacles.map(obstacleKeyPart).join("|"),
  );

  return [
    quantize(edge.sourceX),
    quantize(edge.sourceY),
    quantize(edge.targetX),
    quantize(edge.targetY),
    edge.sourcePosition,
    edge.targetPosition,
    edge.preset,
    waypointsKey,
    optionsKey,
    JSON.stringify(edge.options ?? null),
    obstaclesKey,
  ].join("|");
};
