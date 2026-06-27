import type { Position, XYPosition } from "@xyflow/react";
import type { EndpointInfo } from "./alignEndpoints";

/**
 * The four handle sides as plain string literals. `Position`'s enum values are
 * exactly these strings, so comparing against them avoids importing the
 * `@xyflow/react` runtime (and pulling React) into the Web Worker bundle.
 */
type HandleSide = "top" | "right" | "bottom" | "left";

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
  position: Position | HandleSide;
}

const isHorizontalSide = (position: Position | HandleSide): boolean =>
  position === "left" || position === "right";

/**
 * Control point for a cubic segment, ported from xyflow's SimpleBezierEdge.
 * @see https://github.com/xyflow/xyflow/blob/main/packages/react/src/components/Edges/SimpleBezierEdge.tsx
 */
const getSimpleBezierControl = (
  pos: Position | HandleSide,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): [number, number] => {
  if (isHorizontalSide(pos)) {
    return [0.5 * (fromX + toX), fromY];
  }

  return [fromX, 0.5 * (fromY + toY)];
};

/** Infers a handle side from the dominant travel direction between two points. */
const inferHandlePosition = (
  from: XYPosition,
  toward: XYPosition,
): HandleSide => {
  const deltaX = toward.x - from.x;
  const deltaY = toward.y - from.y;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0 ? "right" : "left";
  }

  return deltaY >= 0 ? "bottom" : "top";
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
  const waypoints = path.map(([posX, posY]) => ({ x: posX, y: posY }));
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
    const targetPoint = points[index + 1];
    const [sourceControlX, sourceControlY] = getSimpleBezierControl(
      from.position,
      from.x,
      from.y,
      targetPoint.x,
      targetPoint.y,
    );
    const [targetControlX, targetControlY] = getSimpleBezierControl(
      targetPoint.position,
      targetPoint.x,
      targetPoint.y,
      from.x,
      from.y,
    );

    svgPath += ` C${String(sourceControlX)},${String(sourceControlY)} ${String(targetControlX)},${String(targetControlY)} ${String(targetPoint.x)},${String(targetPoint.y)}`;
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
    const [posX, posY] = point;
    svgPathString += `L ${String(posX)}, ${String(posY)} `;
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
  const axisX = 0;
  const axisY = 1;
  let point = points[0];

  const first = points[0];
  let svgPath = `M${String(first[axisX])},${String(first[axisY])}M`;

  for (const next of points) {
    const midPoint = getMidPoint(
      point[axisX],
      point[axisY],
      next[axisX],
      next[axisY],
    );

    svgPath += ` ${String(midPoint[axisX])},${String(midPoint[axisY])}`;
    svgPath += `Q${String(next[axisX])},${String(next[axisY])}`;
    point = next;
  }

  const last = points[points.length - 1];
  svgPath += ` ${String(last[0])},${String(last[1])}`;

  return svgPath;
};

const getMidPoint = (
  pointAx: number,
  pointAy: number,
  pointBx: number,
  pointBy: number,
) => {
  const midX = (pointAx - pointBx) / 2 + pointBx;
  const midY = (pointAy - pointBy) / 2 + pointBy;
  return [midX, midY];
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
      ...path.map(([posX, posY]) => ({ x: posX, y: posY })),
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

const distance = (first: XYPosition, second: XYPosition) =>
  Math.sqrt(Math.pow(second.x - first.x, 2) + Math.pow(second.y - first.y, 2));

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
  pointA: XYPosition,
  pointB: XYPosition,
  pointC: XYPosition,
  size: number,
): string => {
  const bendSize = Math.min(
    distance(pointA, pointB) / 2,
    distance(pointB, pointC) / 2,
    size,
  );
  const { x: cornerX, y: cornerY } = pointB;

  // Collinear points: no corner to round.
  if (
    (pointA.x === cornerX && cornerX === pointC.x) ||
    (pointA.y === cornerY && cornerY === pointC.y)
  ) {
    return `L ${String(cornerX)},${String(cornerY)} `;
  }

  // First segment is horizontal.
  if (pointA.y === cornerY) {
    const xDir = pointA.x < pointC.x ? -1 : 1;
    const yDir = pointA.y < pointC.y ? 1 : -1;
    return `L ${String(cornerX + bendSize * xDir)},${String(cornerY)}Q ${String(cornerX)},${String(cornerY)} ${String(cornerX)},${String(cornerY + bendSize * yDir)} `;
  }

  // First segment is vertical.
  const xDir = pointA.x < pointC.x ? 1 : -1;
  const yDir = pointA.y < pointC.y ? -1 : 1;
  return `L ${String(cornerX)},${String(cornerY + bendSize * yDir)}Q ${String(cornerX)},${String(cornerY)} ${String(cornerX + bendSize * xDir)},${String(cornerY)} `;
};
