import type { XYPosition } from "@xyflow/react";

/**
 * Takes source and target {x, y} points, together with an array of number
 * tuples [x, y] representing the points along the path, and returns a string
 * to be used as the SVG path.
 */
export type SVGDrawFunction = (
  source: XYPosition,
  target: XYPosition,
  path: number[][],
) => string;

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
