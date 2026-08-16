import { rectIntersectsBox } from "./obstacleIndex";
import type { ObstacleBox } from "./obstacleIndex";
import type { XYPosition } from "@xyflow/react";

/** Axis-aligned rect in graph coordinates — an `ObstacleBox` without the id
 * it doesn't need here. */
export type EdgeRect = Omit<ObstacleBox, "id">;

/**
 * The bounding box of a polyline (graph coordinates), inflated by `pad` on
 * every side. Used to turn an edge's actual rendered path — the routed
 * `points`, or the native (unrouted) polyline it draws while clear — into
 * the region that determines whether that specific path is still valid: any
 * node entering or leaving this region can plausibly change it, so this is
 * the edge's real invalidation corridor, as opposed to a fixed guess based
 * only on its endpoints (see `schedulerFlush.ts`'s `buildEdgeCorridor`, kept
 * only to bucket the route cache's key, not to decide correctness).
 */
export const boundsOfPolyline = (
  points: readonly XYPosition[],
  pad: number,
): EdgeRect => {
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);

  return {
    xMin: Math.min(...xValues) - pad,
    yMin: Math.min(...yValues) - pad,
    xMax: Math.max(...xValues) + pad,
    yMax: Math.max(...yValues) + pad,
  };
};

/** Every obstacle box whose rect overlaps `corridor`. */
export const filterObstaclesInCorridor = (
  corridor: EdgeRect,
  boxes: ObstacleBox[],
): ObstacleBox[] =>
  boxes.filter((box) =>
    rectIntersectsBox(
      corridor.xMin,
      corridor.yMin,
      corridor.xMax,
      corridor.yMax,
      box,
    ),
  );

/**
 * Raw obstacle signature (before hashing): an exact, order-sensitive string
 * two obstacle lists only share when every entry has the same id and rect.
 * Comparing this — rather than just a hashed cache key — catches the rare
 * hash collision a key alone can't detect, and, recomputed against an edge's
 * actual-path corridor instead of the cache key's rung-0 one, is what
 * actually re-validates a cache hit against the current obstacle set.
 */
export const obstaclesSignatureOf = (boxes: ObstacleBox[]): string =>
  boxes
    .map((box) => [box.id, box.xMin, box.yMin, box.xMax, box.yMax].join(","))
    .join("|");
