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
    const [x, y] = polyline[0] ?? [0, 0];
    return { x, y };
  }

  let total = 0;
  for (let i = 1; i < polyline.length; i++) {
    total += Math.hypot(
      polyline[i][0] - polyline[i - 1][0],
      polyline[i][1] - polyline[i - 1][1],
    );
  }

  const targetDistance = total * fraction;
  let accumulated = 0;
  for (let i = 1; i < polyline.length; i++) {
    const segmentLength = Math.hypot(
      polyline[i][0] - polyline[i - 1][0],
      polyline[i][1] - polyline[i - 1][1],
    );
    if (accumulated + segmentLength >= targetDistance) {
      const remaining = targetDistance - accumulated;
      const t = segmentLength === 0 ? 0 : remaining / segmentLength;
      return {
        x: polyline[i - 1][0] + (polyline[i][0] - polyline[i - 1][0]) * t,
        y: polyline[i - 1][1] + (polyline[i][1] - polyline[i - 1][1]) * t,
      };
    }
    accumulated += segmentLength;
  }

  const [x, y] = polyline[polyline.length - 1];
  return { x, y };
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

  for (let i = from; i < polyline.length - 1; i++) {
    const distance =
      (polyline[i][0] - point.x) ** 2 + (polyline[i][1] - point.y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
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

  segments.forEach((segment, i) => {
    const midpoint = pointAlongPolyline(segment, 0.5);
    result.push({
      id: `__inactive-${String(i)}`,
      x: midpoint.x,
      y: midpoint.y,
      active: false,
    });

    if (i < activePoints.length) {
      result.push(activePoints[i]);
    }
  });

  return result;
};
