import type { Position, XYPosition } from "@xyflow/react";

type Direction = "top" | "bottom" | "left" | "right";

/**
 * Source/target points carry both their graph coordinates and the side of the
 * node they are attached to (top/bottom/left/right).
 */
export interface EndpointInfo extends XYPosition {
  position: Position;
}

/**
 * Returns the index of the path tuple that varies for a given handle position.
 * Vertical handles (top/bottom) leave/enter on the X axis; horizontal handles
 * (left/right) leave/enter on the Y axis.
 */
const axisFor = (position: Direction): 0 | 1 =>
  position === "top" || position === "bottom" ? 0 : 1;

/**
 * Aligns the leading and trailing runs of the grid-snapped graph path with the
 * actual handle coordinates so the rendered edge enters and leaves each node
 * perpendicular to its handle, with no diagonal or L-shaped jog near the
 * endpoints.
 *
 * The grid path's first cells will all share the same X (for top/bottom
 * handles) or the same Y (for left/right handles) until the path turns. We
 * rewrite that perpendicular axis on each leading cell to match the handle's
 * actual coordinate. The first turn in the path is therefore purely
 * orthogonal: the segment from the last leading cell to the next path cell
 * shares the parallel axis, so it remains a straight horizontal/vertical line
 * even after the shift.
 *
 * The same operation is applied symmetrically to the trailing run for the
 * target. The trailing scan is bounded so it cannot reach into cells already
 * claimed by the leading shift, and the trailing column/row is detected from
 * the original (un-shifted) path so a same-axis leading shift cannot corrupt
 * detection in the common case where source and target share an axis.
 */
export const alignEndpoints = (
  source: EndpointInfo,
  target: EndpointInfo,
  graphPath: number[][],
): number[][] => {
  if (graphPath.length === 0) return graphPath;

  const result = graphPath.map(([x, y]) => [x, y]);

  const sourceAxis = axisFor(source.position);
  const sourceCoord = sourceAxis === 0 ? source.x : source.y;
  const sourceLeadingValue = result[0][sourceAxis];

  let leadEnd = 0;
  while (
    leadEnd < result.length &&
    result[leadEnd][sourceAxis] === sourceLeadingValue
  ) {
    leadEnd++;
  }

  for (let i = 0; i < leadEnd; i++) {
    result[i][sourceAxis] = sourceCoord;
  }

  const targetAxis = axisFor(target.position);
  const targetCoord = targetAxis === 0 ? target.x : target.y;
  const targetTrailingValue = graphPath[graphPath.length - 1][targetAxis];

  let trailStart = result.length;
  while (
    trailStart > leadEnd &&
    graphPath[trailStart - 1][targetAxis] === targetTrailingValue
  ) {
    trailStart--;
  }

  for (let i = trailStart; i < result.length; i++) {
    result[i][targetAxis] = targetCoord;
  }

  return result;
};
