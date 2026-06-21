import type { XYPosition } from "@xyflow/react";
import type { ControlPointData } from "./ControlPoint";

/**
 * Returns the point at the given fraction (0..1) of a polyline's arc length.
 */
export const pointAlongPolyline = (
  polyline: number[][],
  fraction: number,
): XYPosition => {
  if (polyline.length < 2) {
    const [posX, posY] = polyline[0] ?? [0, 0];
    return { x: posX, y: posY };
  }

  let total = 0;
  for (let index = 1; index < polyline.length; index++) {
    total += Math.hypot(
      polyline[index][0] - polyline[index - 1][0],
      polyline[index][1] - polyline[index - 1][1],
    );
  }

  const targetDistance = total * fraction;
  let accumulated = 0;
  for (let index = 1; index < polyline.length; index++) {
    const segmentLength = Math.hypot(
      polyline[index][0] - polyline[index - 1][0],
      polyline[index][1] - polyline[index - 1][1],
    );
    if (accumulated + segmentLength >= targetDistance) {
      const remaining = targetDistance - accumulated;
      const segmentFraction =
        segmentLength === 0 ? 0 : remaining / segmentLength;
      return {
        x:
          polyline[index - 1][0] +
          (polyline[index][0] - polyline[index - 1][0]) * segmentFraction,
        y:
          polyline[index - 1][1] +
          (polyline[index][1] - polyline[index - 1][1]) * segmentFraction,
      };
    }
    accumulated += segmentLength;
  }

  const [posX, posY] = polyline[polyline.length - 1];
  return { x: posX, y: posY };
};

/**
 * Index of the polyline vertex closest to `point`, searching from `from`
 * (exclusive of the endpoints) onward.
 */
export const closestVertexIndex = (
  polyline: number[][],
  point: ControlPointData,
  from: number,
): number => {
  let bestIndex = from;
  let bestDistance = Infinity;

  for (let index = from; index < polyline.length - 1; index++) {
    const distance =
      (polyline[index][0] - point.x) ** 2 + (polyline[index][1] - point.y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
};

/**
 * Splits the routed polyline into one sub-polyline per segment, cutting at the
 * vertex nearest each waypoint.
 */
export const splitPolylineAtWaypoints = (
  polyline: number[][],
  waypoints: ControlPointData[],
): number[][][] => {
  if (polyline.length === 0) return [[]];
  if (waypoints.length === 0) return [polyline];

  const segments: number[][][] = [];
  let start = 0;
  let searchFrom = 1;

  for (const waypoint of waypoints) {
    const cut = closestVertexIndex(polyline, waypoint, searchFrom);
    segments.push(polyline.slice(start, cut + 1));
    start = cut;
    searchFrom = cut + 1;
  }

  segments.push(polyline.slice(start));
  return segments;
};

/**
 * Builds the interleaved control point list `[inactive, active, inactive, ...]`
 * from the active waypoints plus an inactive "insert" point at the midpoint of
 * each routed segment.
 */
export const buildControlPoints = (
  source: XYPosition,
  target: XYPosition,
  activePoints: ControlPointData[],
  routedInterior: number[][],
): ControlPointData[] => {
  const polyline: number[][] = [
    [source.x, source.y],
    ...routedInterior,
    [target.x, target.y],
  ];
  const segments = splitPolylineAtWaypoints(polyline, activePoints);
  const result: ControlPointData[] = [];

  segments.forEach((segment, segmentIndex) => {
    const midpoint = pointAlongPolyline(segment, 0.5);
    result.push({
      id: `__inactive-${String(segmentIndex)}`,
      x: midpoint.x,
      y: midpoint.y,
      active: false,
    });

    if (segmentIndex < activePoints.length) {
      result.push(activePoints[segmentIndex]);
    }
  });

  return result;
};
