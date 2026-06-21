import { Position } from "@xyflow/react";
import type { XYPosition } from "@xyflow/react";
import type { EndpointInfo } from "./alignEndpoints";

/**
 * Takes source and target `{x, y}` points, together with an array of number
 * tuples `[x, y]` representing the points along the path, and returns a string
 * to be used as the SVG path.
 */
export type SVGDrawFunction = (
  source: XYPosition,
  target: XYPosition,
  path: number[][],
) => string;

/**
 * Like {@link SVGDrawFunction}, but requires handle positions on the endpoints
 * so cubic control points can mirror React Flow's `SimpleBezierEdge`.
 */
export type SVGSimpleBezierDrawFunction = (
  source: EndpointInfo,
  target: EndpointInfo,
  path: number[][],
) => string;

/** Values accepted by {@link GetSmartEdgeOptions.drawEdge}. */
export type DrawEdgeFunction = SVGDrawFunction | SVGSimpleBezierDrawFunction;

interface SimpleBezierPoint extends XYPosition {
  position: Position;
}

/**
 * Control point for a cubic segment, ported from xyflow's SimpleBezierEdge.
 * @see https://github.com/xyflow/xyflow/blob/main/packages/react/src/components/Edges/SimpleBezierEdge.tsx
 */
const getSimpleBezierControl = (
  pos: Position,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): [number, number] => {
  if (pos === Position.Left || pos === Position.Right) {
    return [0.5 * (x1 + x2), y1];
  }

  return [x1, 0.5 * (y1 + y2)];
};

/** Infers a handle side from the dominant travel direction between two points. */
const inferHandlePosition = (from: XYPosition, to: XYPosition): Position => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? Position.Right : Position.Left;
  }

  return dy >= 0 ? Position.Bottom : Position.Top;
};

const toSimpleBezierPoint = (
  point: XYPosition,
  prev: XYPosition,
  next: XYPosition,
): SimpleBezierPoint => ({
  x: point.x,
  y: point.y,
  position: inferHandlePosition(prev, next),
});

/**
 * Draws an SVG path using chained cubic bezier segments with handle-position
 * controls, mirroring React Flow's SimpleBezierEdge.
 */
export const svgDrawSimpleBezierLinePath: SVGSimpleBezierDrawFunction = (
  source,
  target,
  path,
) => {
  const waypoints = path.map(([x, y]) => ({ x, y }));
  const allPoints: XYPosition[] = [source, ...waypoints, target];

  const points: SimpleBezierPoint[] = allPoints.map((point, index) => {
    if (index === 0) {
      return source;
    }
    if (index === allPoints.length - 1) {
      return target;
    }

    return toSimpleBezierPoint(
      point,
      allPoints[index - 1],
      allPoints[index + 1],
    );
  });

  let svgPath = `M${String(points[0].x)},${String(points[0].y)}`;

  for (let index = 0; index < points.length - 1; index++) {
    const from = points[index];
    const to = points[index + 1];
    const [sourceControlX, sourceControlY] = getSimpleBezierControl(
      from.position,
      from.x,
      from.y,
      to.x,
      to.y,
    );
    const [targetControlX, targetControlY] = getSimpleBezierControl(
      to.position,
      to.x,
      to.y,
      from.x,
      from.y,
    );

    svgPath += ` C${String(sourceControlX)},${String(sourceControlY)} ${String(targetControlX)},${String(targetControlY)} ${String(to.x)},${String(to.y)}`;
  }

  return svgPath;
};

/**
 * Draws a SVG path from a list of points, using straight lines.
 */
export const svgDrawStraightLinePath: SVGDrawFunction = (
  source,
  target,
  path,
) => {
  let svgPathString = `M ${String(source.x)}, ${String(source.y)} `;

  path.forEach((point) => {
    const [x, y] = point;
    svgPathString += `L ${String(x)}, ${String(y)} `;
  });

  svgPathString += `L ${String(target.x)}, ${String(target.y)} `;

  return svgPathString;
};

/**
 * Draws a SVG path from a list of points, using rounded lines.
 */
export const svgDrawSmoothLinePath: SVGDrawFunction = (
  source,
  target,
  path,
) => {
  const points = [[source.x, source.y], ...path, [target.x, target.y]];
  return quadraticBezierCurve(points);
};

const quadraticBezierCurve = (points: number[][]) => {
  const X = 0;
  const Y = 1;
  let point = points[0];

  const first = points[0];
  let svgPath = `M${String(first[X])},${String(first[Y])}M`;

  for (const next of points) {
    const midPoint = getMidPoint(point[X], point[Y], next[X], next[Y]);

    svgPath += ` ${String(midPoint[X])},${String(midPoint[Y])}`;
    svgPath += `Q${String(next[X])},${String(next[Y])}`;
    point = next;
  }

  const last = points[points.length - 1];
  svgPath += ` ${String(last[0])},${String(last[1])}`;

  return svgPath;
};

const getMidPoint = (Ax: number, Ay: number, Bx: number, By: number) => {
  const Zx = (Ax - Bx) / 2 + Bx;
  const Zy = (Ay - By) / 2 + By;
  return [Zx, Zy];
};

export interface SmoothStepOptions {
  borderRadius?: number;
}

/**
 * Returns a {@link SVGDrawFunction} that draws an orthogonal ("step") path with
 * rounded corners, mirroring React Flow's smooth step edge. The `borderRadius`
 * controls how much each corner is rounded (default `5`, matching React Flow);
 * it is clamped per-corner to half of the adjacent segment lengths so tight
 * grid corners never overshoot.
 *
 * Adapted from https://gist.github.com/holgergp/b95396f8e81abb17add1809c404b163c
 */
export const svgDrawSmoothStepLinePath = (
  options: SmoothStepOptions = {},
): SVGDrawFunction => {
  const { borderRadius = 5 } = options;

  return (source, target, path) => {
    const points: XYPosition[] = dedupePoints([
      { x: source.x, y: source.y },
      ...path.map(([x, y]) => ({ x, y })),
      { x: target.x, y: target.y },
    ]);

    return points.reduce((svgPath, point, index) => {
      const isInteriorPoint = index > 0 && index < points.length - 1;

      if (isInteriorPoint) {
        return (
          svgPath +
          getBend(points[index - 1], point, points[index + 1], borderRadius)
        );
      }

      const command = index === 0 ? "M" : "L";
      return svgPath + `${command} ${String(point.x)},${String(point.y)} `;
    }, "");
  };
};

const distance = (a: XYPosition, b: XYPosition) =>
  Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));

/**
 * Drops consecutive duplicate points so corner rounding doesn't produce
 * degenerate (zero-length) bends. The endpoint alignment step can repeat the
 * source/target coordinate as the first/last path point.
 */
const dedupePoints = (points: XYPosition[]) =>
  points.filter(
    (point, index) =>
      index === 0 ||
      point.x !== points[index - 1].x ||
      point.y !== points[index - 1].y,
  );

const getBend = (
  a: XYPosition,
  b: XYPosition,
  c: XYPosition,
  size: number,
): string => {
  const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size);
  const { x, y } = b;

  // Collinear points: no corner to round.
  if ((a.x === x && x === c.x) || (a.y === y && y === c.y)) {
    return `L ${String(x)},${String(y)} `;
  }

  // First segment is horizontal.
  if (a.y === y) {
    const xDir = a.x < c.x ? -1 : 1;
    const yDir = a.y < c.y ? 1 : -1;
    return `L ${String(x + bendSize * xDir)},${String(y)}Q ${String(x)},${String(y)} ${String(x)},${String(y + bendSize * yDir)} `;
  }

  // First segment is vertical.
  const xDir = a.x < c.x ? 1 : -1;
  const yDir = a.y < c.y ? -1 : 1;
  return `L ${String(x)},${String(y + bendSize * yDir)}Q ${String(x)},${String(y)} ${String(x + bendSize * xDir)},${String(y)} `;
};
