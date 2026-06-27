import type { XYPosition } from "@xyflow/react";

/**
 * A bridge "hop" to draw on a routed orthogonal polyline where it crosses
 * another edge. `segmentIndex` is the polyline segment the crossing lies on and
 * `at` is the (positive) distance from that segment's start point to the
 * crossing.
 */
export interface Hop {
  segmentIndex: number;
  at: number;
}

/** Default axis-alignment / crossing tolerance in pixels. */
export const DEFAULT_HOP_EPSILON = 0.5;

/**
 * Builds the orthogonal polyline an edge is drawn along, from its source/target
 * handle coordinates and the routed interior points returned by `getSmartEdge`.
 *
 * Consecutive duplicate points are dropped, and collinear midpoints are merged
 * so each straight run becomes a single maximal segment. Merging matters for
 * hop detection: routed paths contain many collinear grid points, so a crossing
 * frequently lands exactly on one of them — which strict-interior detection
 * would otherwise miss because it sits on a segment boundary.
 */
export const toPolyline = (
  source: XYPosition,
  target: XYPosition,
  path: number[][],
): XYPosition[] => {
  const raw: XYPosition[] = [
    { x: source.x, y: source.y },
    ...path.map(([posX, posY]) => ({ x: posX, y: posY })),
    { x: target.x, y: target.y },
  ];

  const deduped = raw.filter(
    (point, index) =>
      index === 0 ||
      point.x !== raw[index - 1].x ||
      point.y !== raw[index - 1].y,
  );

  const result: XYPosition[] = [];
  for (let index = 0; index < deduped.length; index++) {
    const current = deduped[index];
    const hasNeighbors = index > 0 && index < deduped.length - 1;

    if (hasNeighbors) {
      const previous = result[result.length - 1];
      const next = deduped[index + 1];
      const collinearX = previous.x === current.x && current.x === next.x;
      const collinearY = previous.y === current.y && current.y === next.y;
      if (collinearX || collinearY) continue;
    }

    result.push(current);
  }

  return result;
};

/** Whether `value` lies strictly inside the open interval (bound1, bound2). */
const strictlyBetween = (
  value: number,
  bound1: number,
  bound2: number,
  epsilon: number,
): boolean => {
  const min = Math.min(bound1, bound2);
  const max = Math.max(bound1, bound2);
  return value > min + epsilon && value < max - epsilon;
};

/**
 * Crossing test for a horizontal segment of "my" polyline against a vertical
 * segment of another polyline.
 */
const horizontalCrossing = (
  segmentStart: XYPosition,
  segmentEnd: XYPosition,
  otherStart: XYPosition,
  otherEnd: XYPosition,
  epsilon: number,
  segmentIndex: number,
): Hop | null => {
  const crossX = otherStart.x;
  const crossY = segmentStart.y;
  if (
    strictlyBetween(crossX, segmentStart.x, segmentEnd.x, epsilon) &&
    strictlyBetween(crossY, otherStart.y, otherEnd.y, epsilon)
  ) {
    return { segmentIndex, at: Math.abs(crossX - segmentStart.x) };
  }
  return null;
};

/**
 * Crossing test for a vertical segment of "my" polyline against a horizontal
 * segment of another polyline.
 */
const verticalCrossing = (
  segmentStart: XYPosition,
  segmentEnd: XYPosition,
  otherStart: XYPosition,
  otherEnd: XYPosition,
  epsilon: number,
  segmentIndex: number,
): Hop | null => {
  const crossY = otherStart.y;
  const crossX = segmentStart.x;
  if (
    strictlyBetween(crossY, segmentStart.y, segmentEnd.y, epsilon) &&
    strictlyBetween(crossX, otherStart.x, otherEnd.x, epsilon)
  ) {
    return { segmentIndex, at: Math.abs(crossY - segmentStart.y) };
  }
  return null;
};

/** A single axis-aligned segment of "my" polyline being tested for crossings. */
interface MySegment {
  start: XYPosition;
  end: XYPosition;
  index: number;
  isHorizontal: boolean;
  isVertical: boolean;
}

/**
 * Returns the hop where `segment` crosses a single other segment, or `null` for
 * any non-perpendicular pairing.
 */
const segmentPairHop = (
  segment: MySegment,
  otherStart: XYPosition,
  otherEnd: XYPosition,
  epsilon: number,
): Hop | null => {
  const otherHorizontal = Math.abs(otherStart.y - otherEnd.y) < epsilon;
  const otherVertical = Math.abs(otherStart.x - otherEnd.x) < epsilon;

  if (segment.isHorizontal && otherVertical && !otherHorizontal) {
    return horizontalCrossing(
      segment.start,
      segment.end,
      otherStart,
      otherEnd,
      epsilon,
      segment.index,
    );
  }
  if (segment.isVertical && otherHorizontal && !otherVertical) {
    return verticalCrossing(
      segment.start,
      segment.end,
      otherStart,
      otherEnd,
      epsilon,
      segment.index,
    );
  }
  return null;
};

/** Collects every hop where `segment` crosses one other polyline. */
const crossingsAgainst = (
  segment: MySegment,
  other: XYPosition[],
  epsilon: number,
): Hop[] => {
  const hops: Hop[] = [];
  for (let index = 0; index < other.length - 1; index++) {
    const hop = segmentPairHop(
      segment,
      other[index],
      other[index + 1],
      epsilon,
    );
    if (hop) hops.push(hop);
  }
  return hops;
};

/**
 * Detects where an orthogonal polyline crosses other orthogonal polylines and
 * returns the hops to draw on it. Only strictly-interior perpendicular
 * crossings (a horizontal segment meeting a vertical one) produce a hop;
 * collinear overlaps, T-junctions at shared endpoints, and diagonal segments
 * are ignored.
 */
export const computeEdgeHops = (
  polyline: XYPosition[],
  otherPolylines: XYPosition[][],
  epsilon: number = DEFAULT_HOP_EPSILON,
): Hop[] => {
  const hops: Hop[] = [];

  for (let index = 0; index < polyline.length - 1; index++) {
    const start = polyline[index];
    const end = polyline[index + 1];
    const segment: MySegment = {
      start,
      end,
      index,
      isHorizontal: Math.abs(start.y - end.y) < epsilon,
      isVertical: Math.abs(start.x - end.x) < epsilon,
    };
    if (!segment.isHorizontal && !segment.isVertical) continue;

    for (const other of otherPolylines) {
      hops.push(...crossingsAgainst(segment, other, epsilon));
    }
  }

  return hops;
};
