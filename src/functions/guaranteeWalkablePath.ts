import { isWalkable, setBlocked, isInside } from "../pathfinding/flatGrid";
import type { FlatGrid } from "../pathfinding/flatGrid";
import type { Position, XYPosition } from "@xyflow/react";

type Direction = "top" | "bottom" | "left" | "right";

export const getNextPointFromPosition = (
  point: XYPosition,
  position: Direction,
): XYPosition => {
  switch (position) {
    case "top":
      return { x: point.x, y: point.y - 1 };
    case "bottom":
      return { x: point.x, y: point.y + 1 };
    case "left":
      return { x: point.x - 1, y: point.y };
    case "right":
      return { x: point.x + 1, y: point.y };
  }
};

/**
 * Guarantee that the path is walkable, even if the point is inside a non
 * walkable area, by carving a walkable lane in the direction of the point's
 * Position. Stops at the grid border.
 */
export const guaranteeWalkablePath = (
  grid: FlatGrid,
  point: XYPosition,
  position: Position,
): void => {
  let current = { x: point.x, y: point.y };
  while (
    isInside(grid, current.x, current.y) &&
    !isWalkable(grid, current.x, current.y)
  ) {
    setBlocked(grid, current.x, current.y, false);
    current = getNextPointFromPosition(current, position);
  }
};
