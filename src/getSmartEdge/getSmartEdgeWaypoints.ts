import { Position } from "@xyflow/react";
import { getSmartEdge } from ".";
import { svgDrawSmoothLinePath, round, toInteger } from "../functions";
import type { XYPosition, Node } from "@xyflow/react";
import type {
  GetSmartEdgeOptions,
  GetSmartEdgeParams,
  GetSmartEdgeReturn,
} from ".";

export type GetSmartEdgeWaypointsParams<
  NodeDataType extends Record<string, unknown> = Record<string, unknown>,
> = GetSmartEdgeParams<NodeDataType> & {
  /**
   * Intermediate points (in graph coordinates) the edge must pass through, in
   * order from source to target. With no waypoints this behaves exactly like
   * {@link getSmartEdge}.
   */
  waypoints: XYPosition[];
};

/**
 * Returns the side of `from` (top/right/bottom/left) that faces `to`, used as
 * the synthetic handle position for a free waypoint endpoint so each routed
 * segment leaves/enters the waypoint pointing along the path.
 */
const sideFacing = (point: XYPosition, toward: XYPosition): Position => {
  const dx = toward.x - point.x;
  const dy = toward.y - point.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? Position.Right : Position.Left;
  }
  return dy >= 0 ? Position.Bottom : Position.Top;
};

interface StitchPoint {
  x: number;
  y: number;
  /** Whether this point is a user waypoint (must lie exactly on the path). */
  waypoint: boolean;
}

/**
 * Collapses consecutive duplicate coordinates (segment join artifacts),
 * preserving the waypoint flag if either side of the duplicate was a waypoint.
 */
const dedupeStitchPoints = (raw: StitchPoint[]): StitchPoint[] => {
  const result: StitchPoint[] = [];
  for (const point of raw) {
    const lastIndex = result.length - 1;
    if (
      lastIndex >= 0 &&
      result[lastIndex].x === point.x &&
      result[lastIndex].y === point.y
    ) {
      result[lastIndex].waypoint = result[lastIndex].waypoint || point.waypoint;
    } else {
      result.push({ ...point });
    }
  }
  return result;
};

/**
 * Routes each consecutive pair in the endpoint chain with {@link getSmartEdge}
 * and collects the stitched points. Free waypoint endpoints get a synthetic
 * handle position derived from the travel direction, and the waypoint
 * coordinates themselves are flagged so they can be pinned onto the path.
 */
const routeChainSegments = <
  NodeDataType extends Record<string, unknown> = Record<string, unknown>,
>(
  chain: XYPosition[],
  sourcePosition: Position,
  targetPosition: Position,
  nodes: Node<NodeDataType>[],
  options: GetSmartEdgeOptions,
): StitchPoint[] => {
  const lastIndex = chain.length - 1;
  const raw: StitchPoint[] = [];

  for (let i = 0; i < lastIndex; i++) {
    const from = chain[i];
    const to = chain[i + 1];

    const fromPosition = i === 0 ? sourcePosition : sideFacing(from, to);
    const toPosition =
      i + 1 === lastIndex ? targetPosition : sideFacing(to, from);

    const segment = getSmartEdge<NodeDataType>({
      sourceX: from.x,
      sourceY: from.y,
      sourcePosition: fromPosition,
      targetX: to.x,
      targetY: to.y,
      targetPosition: toPosition,
      nodes,
      options,
    });

    // On a per-segment failure we omit its routed points; the single
    // `drawEdge` pass then connects the surrounding endpoints in the edge's own
    // line style (bezier/straight/step) instead of dropping the edge.
    if (!(segment instanceof Error)) {
      for (const [x, y] of segment.points) {
        raw.push({ x, y, waypoint: false });
      }
    }

    // Pin the path to the actual waypoint coordinate (the control point
    // handle). The final `to` is the target handle, added by `drawEdge`.
    if (i + 1 < lastIndex) {
      raw.push({ x: to.x, y: to.y, waypoint: true });
    }
  }

  return raw;
};

/** Fraction of the nearest-neighbor distance used for waypoint tangents. */
const STRADDLE_FRACTION = 0.5;

/**
 * The logical routed path: every stitch point once, with waypoints kept at
 * their exact coordinates. Used for the edge center and for placing control
 * points (which match waypoints by exact coordinate).
 */
const toLogicalPoints = (points: StitchPoint[]): number[][] =>
  points.map((point) => [point.x, point.y]);

/**
 * Returns a pair of points straddling a waypoint along the local path tangent,
 * whose midpoint is exactly the waypoint.
 *
 * The smooth (quadratic) draw function passes through the midpoint of each
 * consecutive control pair, so a lone waypoint control would only pull the
 * curve toward it, and a duplicated waypoint would stop the curve dead (a
 * zero-velocity cusp) — both look like a kink rather than a single flow.
 * Emitting two points around the waypoint instead makes the curve pass
 * smoothly through it, tangent to the routed path. The pair is bounded by the
 * neighbor spacing so it never overshoots into a loop, and stays collinear
 * through the waypoint for the straight/step draw functions.
 */
const straddleWaypoint = (
  waypoint: { x: number; y: number },
  before: { x: number; y: number },
  after: { x: number; y: number },
): number[][] => {
  const dirX = after.x - before.x;
  const dirY = after.y - before.y;
  const dirLength = Math.hypot(dirX, dirY);

  if (dirLength === 0) {
    return [[waypoint.x, waypoint.y]];
  }

  const unitX = dirX / dirLength;
  const unitY = dirY / dirLength;

  const distBefore = Math.hypot(waypoint.x - before.x, waypoint.y - before.y);
  const distAfter = Math.hypot(waypoint.x - after.x, waypoint.y - after.y);
  const length = Math.min(distBefore, distAfter) * STRADDLE_FRACTION;

  return [
    [waypoint.x - unitX * length, waypoint.y - unitY * length],
    [waypoint.x + unitX * length, waypoint.y + unitY * length],
  ];
};

/**
 * The points fed to `drawEdge`: identical to the logical path, except each
 * waypoint is replaced by a straddling pair so the rendered curve flows
 * smoothly through it (see {@link straddleWaypoint}).
 */
const toDrawPoints = (
  points: StitchPoint[],
  source: XYPosition,
  target: XYPosition,
): number[][] => {
  const result: number[][] = [];

  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    if (!point.waypoint) {
      result.push([point.x, point.y]);
      continue;
    }

    const before = i > 0 ? points[i - 1] : source;
    const after = i < points.length - 1 ? points[i + 1] : target;
    result.push(...straddleWaypoint(point, before, after));
  }

  return result;
};

/**
 * Routes a smart edge that passes through a set of user-defined waypoints.
 *
 * Each consecutive pair in `[source, ...waypoints, target]` is routed
 * independently with {@link getSmartEdge} (so every segment still avoids
 * nodes), then the resulting point lists are stitched together and drawn as a
 * single continuous SVG path. Free waypoint endpoints are given a synthetic
 * handle position derived from the travel direction.
 *
 * If an individual segment fails to route (for example a waypoint dropped
 * inside a node), that segment degrades to a straight line between its
 * endpoints instead of blanking the whole edge.
 */
export const getSmartEdgeWaypoints = <
  NodeDataType extends Record<string, unknown> = Record<string, unknown>,
>(
  params: GetSmartEdgeWaypointsParams<NodeDataType>,
): GetSmartEdgeReturn | Error => {
  const {
    waypoints,
    options = {},
    nodes,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  } = params;

  // No waypoints: identical to a plain smart edge.
  if (waypoints.length === 0) {
    return getSmartEdge(params);
  }

  try {
    const { drawEdge = svgDrawSmoothLinePath } = options;
    const gridRatio = Math.max(toInteger(options.gridRatio ?? 10), 1);

    const source: XYPosition = { x: sourceX, y: sourceY };
    const target: XYPosition = { x: targetX, y: targetY };

    // Snap each waypoint to the nearest path-finding grid coordinate. The
    // routed path is always grid-aligned, so routing/drawing through the exact
    // (off-grid) drag position would force a sub-grid jog where the path meets
    // the waypoint (a visible "bump"). Snapping keeps the path on the grid; the
    // draggable control point itself still renders at the exact drag position.
    const snappedWaypoints = waypoints.map((point) => ({
      x: round(point.x, gridRatio),
      y: round(point.y, gridRatio),
    }));
    const chain: XYPosition[] = [source, ...snappedWaypoints, target];

    const segmentOptions = options;

    const raw = routeChainSegments(
      chain,
      sourcePosition,
      targetPosition,
      nodes,
      segmentOptions,
    );

    const stitched = dedupeStitchPoints(raw);
    const points = toLogicalPoints(stitched);
    const svgPathString = drawEdge(
      { x: sourceX, y: sourceY, position: sourcePosition },
      { x: targetX, y: targetY, position: targetPosition },
      toDrawPoints(stitched, source, target),
    );

    const fullPath = [[source.x, source.y], ...points, [target.x, target.y]];
    const middle = fullPath[Math.floor(fullPath.length / 2)];
    const [edgeCenterX, edgeCenterY] = middle;

    return { svgPathString, edgeCenterX, edgeCenterY, points };
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }
    return new Error(`Unknown error: ${String(error)}`);
  }
};

export type GetSmartEdgeWaypointsFunction = typeof getSmartEdgeWaypoints;
