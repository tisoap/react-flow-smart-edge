import type { Node, Rect, XYPosition, Position } from "@xyflow/react";

/** A `Position`-shaped string union, kept local so this module never needs a
 * runtime import of `@xyflow/react` (it must stay reachable from the worker,
 * see `guaranteeWalkablePath.ts` for the same convention). */
type Direction = "top" | "bottom" | "left" | "right";

/** A padded, axis-aligned obstacle rectangle in graph coordinates. */
export interface ObstacleBox {
  id: string;
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

const buildNodeBox = (node: Node, nodePadding: number): ObstacleBox => {
  const width = Math.max(node.measured?.width ?? 0, 1);
  const height = Math.max(node.measured?.height ?? 0, 1);

  return {
    id: node.id,
    xMin: node.position.x - nodePadding,
    yMin: node.position.y - nodePadding,
    xMax: node.position.x + width + nodePadding,
    yMax: node.position.y + height + nodePadding,
  };
};

const buildAreaBox = (
  area: Rect,
  index: number,
  nodePadding: number,
): ObstacleBox => {
  const width = Math.max(area.width, 1);
  const height = Math.max(area.height, 1);

  return {
    id: `avoid-${String(index)}`,
    xMin: area.x - nodePadding,
    yMin: area.y - nodePadding,
    xMax: area.x + width + nodePadding,
    yMax: area.y + height + nodePadding,
  };
};

/**
 * Build padded obstacle boxes for every node (and optional `avoidAreas`),
 * using the same measured-size floor as `getBoundingBoxes` (missing
 * dimensions collapse to 1px). Unlike `getBoundingBoxes`, these are exact
 * rectangles — not rounded to a path-finding grid.
 *
 * Positions are expected to be absolute graph coordinates; callers resolve
 * subflow offsets before calling this function.
 */
export const buildObstacleBoxes = (
  nodes: Node[],
  nodePadding: number,
  avoidAreas: Rect[] = [],
): ObstacleBox[] => [
  ...nodes.map((node) => buildNodeBox(node, nodePadding)),
  ...avoidAreas.map((area, index) => buildAreaBox(area, index, nodePadding)),
];

/** Axis-aligned rect vs. obstacle-box overlap test (exclusive bounds — a
 * rect that only touches a box's edge does not count as intersecting). */
export const rectIntersectsBox = (
  xMin: number,
  yMin: number,
  xMax: number,
  yMax: number,
  box: ObstacleBox,
): boolean =>
  xMin < box.xMax && xMax > box.xMin && yMin < box.yMax && yMax > box.yMin;

/**
 * Liang-Barsky slab test for whether the segment from (startX, startY) to
 * (endX, endY) intersects the obstacle box (inclusive bounds — a segment
 * running exactly along a box edge counts as intersecting).
 */
export const segmentIntersectsBox = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  box: ObstacleBox,
): boolean => {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  let tMin = 0;
  let tMax = 1;

  const clip = (direction: number, distance: number): boolean => {
    if (direction === 0) return distance >= 0;
    const ratio = distance / direction;
    if (direction < 0) {
      if (ratio > tMax) return false;
      if (ratio > tMin) tMin = ratio;
    } else {
      if (ratio < tMin) return false;
      if (ratio < tMax) tMax = ratio;
    }
    return true;
  };

  return (
    clip(-deltaX, startX - box.xMin) &&
    clip(deltaX, box.xMax - startX) &&
    clip(-deltaY, startY - box.yMin) &&
    clip(deltaY, box.yMax - startY)
  );
};

/**
 * Whether any leg of the polyline intersects any of the given boxes.
 * `excludeIds` skips boxes that should not count as obstacles for this
 * check (typically the polyline's own endpoint nodes).
 */
export const isPolylineBlocked = (
  points: XYPosition[],
  boxes: ObstacleBox[],
  excludeIds?: ReadonlySet<string>,
): boolean => {
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    for (const box of boxes) {
      if (excludeIds?.has(box.id)) continue;
      if (segmentIntersectsBox(start.x, start.y, end.x, end.y, box)) {
        return true;
      }
    }
  }

  return false;
};

const isHorizontal = (position: Direction): boolean =>
  position === "left" || position === "right";

/**
 * The Z/L skeleton approximating xyflow's built-in step path: exits
 * perpendicular to `sourcePosition`, splits at the midpoint of the axis the
 * handles don't share, and enters perpendicular to `targetPosition`.
 */
export const nativeStepPolyline = (
  sourceX: number,
  sourceY: number,
  sourcePosition: Position,
  targetX: number,
  targetY: number,
  targetPosition: Position,
): XYPosition[] => {
  const source: XYPosition = { x: sourceX, y: sourceY };
  const target: XYPosition = { x: targetX, y: targetY };
  const sourceHorizontal = isHorizontal(sourcePosition);
  const targetHorizontal = isHorizontal(targetPosition);

  if (sourceHorizontal && targetHorizontal) {
    const midX = (sourceX + targetX) / 2;
    return [source, { x: midX, y: sourceY }, { x: midX, y: targetY }, target];
  }

  if (!sourceHorizontal && !targetHorizontal) {
    const midY = (sourceY + targetY) / 2;
    return [source, { x: sourceX, y: midY }, { x: targetX, y: midY }, target];
  }

  const corner: XYPosition = sourceHorizontal
    ? { x: targetX, y: sourceY }
    : { x: sourceX, y: targetY };

  return [source, corner, target];
};

/** Options for `isDirectPathBlocked`. */
export interface DirectPathOptions {
  nodePadding?: number;
  avoidAreas?: Rect[];
  excludeNodeIds?: string[];
}

/**
 * Public utility: does a straight line between `source` and `target` cross
 * any padded node (or `avoidAreas`)? Useful for skipping path-finding
 * entirely when a direct line is already clear. `excludeNodeIds` should
 * typically include the edge's own source/target node ids, since a handle
 * point normally sits inside its own node's padded box.
 */
export const isDirectPathBlocked = (
  source: XYPosition,
  target: XYPosition,
  nodes: Node[],
  options?: DirectPathOptions,
): boolean => {
  const nodePadding = options?.nodePadding ?? 10;
  const avoidAreas = options?.avoidAreas ?? [];
  const excludeIds = options?.excludeNodeIds
    ? new Set(options.excludeNodeIds)
    : undefined;
  const boxes = buildObstacleBoxes(nodes, nodePadding, avoidAreas);

  return isPolylineBlocked([source, target], boxes, excludeIds);
};
