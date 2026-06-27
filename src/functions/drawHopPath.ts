import type { XYPosition } from "@xyflow/react";
import type { Hop } from "./edgeHops";

/** Options for {@link drawOrthogonalHopPath}. */
export interface OrthogonalHopOptions {
  /** Radius of the bridge arc drawn at each crossing. Default `6`. */
  hopRadius?: number;
  /**
   * Corner rounding radius. `0` (default) yields sharp step corners; a positive
   * value rounds corners like React Flow's smooth-step edge.
   */
  borderRadius?: number;
}

const DEFAULT_HOP_RADIUS = 6;

const pointDistance = (first: XYPosition, second: XYPosition): number =>
  Math.sqrt(Math.pow(second.x - first.x, 2) + Math.pow(second.y - first.y, 2));

/**
 * The rounded-corner trim at a vertex, clamped to half of each adjacent
 * segment so corners never overshoot. Returns `0` for collinear points (no
 * corner to round). Mirrors the bend sizing used by the smooth-step drawer.
 */
const cornerBendSize = (
  previous: XYPosition,
  corner: XYPosition,
  next: XYPosition,
  radius: number,
): number => {
  const collinear =
    (previous.x === corner.x && corner.x === next.x) ||
    (previous.y === corner.y && corner.y === next.y);
  if (collinear) return 0;
  return Math.min(
    pointDistance(previous, corner) / 2,
    pointDistance(corner, next) / 2,
    radius,
  );
};

/**
 * Returns the point `amount` px from `origin` toward `toward`. Only called with
 * a positive corner bend size, which is itself clamped to half the segment
 * length, so the two points are always distinct.
 */
const movePointToward = (
  origin: XYPosition,
  toward: XYPosition,
  amount: number,
): XYPosition => {
  const ratio = amount / pointDistance(origin, toward);
  return {
    x: origin.x + (toward.x - origin.x) * ratio,
    y: origin.y + (toward.y - origin.y) * ratio,
  };
};

/** SVG arc sweep flag keeping every bump on the same side of the wire. */
const sweepFor = (
  orientation: "horizontal" | "vertical",
  direction: 1 | -1,
): 0 | 1 => {
  if (orientation === "horizontal") return direction === 1 ? 1 : 0;
  return direction === 1 ? 0 : 1;
};

interface AxisSegment {
  /** The constant coordinate of the segment (y for horizontal, x for vertical). */
  fixed: number;
  /** The varying coordinate at the segment's start. */
  start: number;
  /** The varying coordinate at the segment's end. */
  end: number;
}

/**
 * Draws one axis-aligned segment (already trimmed for rounded corners),
 * inserting a small arc "bridge" at each crossing. Hops too close to a trimmed
 * corner or the segment ends are skipped rather than drawn over the rounding.
 */
const drawAxisSegment = (
  line: AxisSegment,
  segmentHops: Hop[],
  hopRadius: number,
  bendStart: number,
  bendEnd: number,
  orientation: "horizontal" | "vertical",
): string => {
  const direction: 1 | -1 = line.end >= line.start ? 1 : -1;
  const drawFrom = line.start + direction * bendStart;
  const drawTo = line.end - direction * bendEnd;

  const pointAt = (along: number): string =>
    orientation === "horizontal"
      ? `${String(along)},${String(line.fixed)}`
      : `${String(line.fixed)},${String(along)}`;

  let svg = "";
  for (const hop of segmentHops) {
    const crossing = line.start + direction * hop.at;
    const before = crossing - direction * hopRadius;
    const after = crossing + direction * hopRadius;
    const clearsCorners =
      direction * (before - drawFrom) > 0 && direction * (drawTo - after) > 0;
    if (clearsCorners) {
      svg += `L ${pointAt(before)} `;
      svg += `A ${String(hopRadius)} ${String(hopRadius)} 0 0 ${String(sweepFor(orientation, direction))} ${pointAt(after)} `;
    }
  }
  svg += `L ${pointAt(drawTo)} `;
  return svg;
};

/**
 * Draws an orthogonal ("step") SVG path through `points`, optionally rounding
 * corners (`borderRadius`) and drawing a small bridge arc at every crossing in
 * `hops`. With an empty `hops` list and `borderRadius` of `0` this is
 * equivalent to a plain step path; with `borderRadius > 0` it matches the
 * smooth-step look while still bridging crossings.
 *
 * `points` must be the full polyline including the source and target endpoints,
 * and each `hop`'s segment index must refer to a segment of that same polyline
 * (see {@link toPolyline} and {@link computeEdgeHops}).
 */
export const drawOrthogonalHopPath = (
  points: XYPosition[],
  hops: Hop[],
  options: OrthogonalHopOptions = {},
): string => {
  const { hopRadius = DEFAULT_HOP_RADIUS, borderRadius = 0 } = options;
  if (points.length === 0) return "";

  let svgPath = `M ${String(points[0].x)},${String(points[0].y)} `;

  for (let index = 0; index < points.length - 1; index++) {
    const start = points[index];
    const end = points[index + 1];

    const bendStart =
      borderRadius > 0 && index > 0
        ? cornerBendSize(points[index - 1], start, end, borderRadius)
        : 0;
    const bendEnd =
      borderRadius > 0 && index < points.length - 2
        ? cornerBendSize(start, end, points[index + 2], borderRadius)
        : 0;

    const segmentHops = hops
      .filter((hop) => hop.segmentIndex === index)
      .sort((first, second) => first.at - second.at);

    const isHorizontal = Math.abs(end.y - start.y) <= Math.abs(end.x - start.x);
    const line: AxisSegment = isHorizontal
      ? { fixed: start.y, start: start.x, end: end.x }
      : { fixed: start.x, start: start.y, end: end.y };

    svgPath += drawAxisSegment(
      line,
      segmentHops,
      hopRadius,
      bendStart,
      bendEnd,
      isHorizontal ? "horizontal" : "vertical",
    );

    if (bendEnd > 0) {
      const exit = movePointToward(end, points[index + 2], bendEnd);
      svgPath += `Q ${String(end.x)},${String(end.y)} ${String(exit.x)},${String(exit.y)} `;
    }
  }

  return svgPath;
};
