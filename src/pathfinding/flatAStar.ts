import { createMinHeap } from "./binaryHeap";
import { isWalkable } from "./flatGrid";
import type { FlatGrid } from "./flatGrid";
import {
  acquireScratch,
  reconstructPath,
  touch,
  STATE_CLOSED,
  STATE_OPEN,
  type SearchScratch,
} from "./searchScratch";

const manhattan = (deltaX: number, deltaY: number): number => deltaX + deltaY;

const octile = (deltaX: number, deltaY: number): number => {
  const diagonalFactor = Math.SQRT2 - 1;
  return deltaX < deltaY
    ? diagonalFactor * deltaX + deltaY
    : diagonalFactor * deltaY + deltaX;
};

/** Orthogonal neighbors first, then diagonals — same order as the old grid. */
const NEIGHBOR_STEPS: readonly (readonly [number, number, number])[] = [
  [0, -1, 1],
  [1, 0, 1],
  [0, 1, 1],
  [-1, 0, 1],
  [1, -1, Math.SQRT2],
  [1, 1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

interface NeighborProcessContext {
  scratch: SearchScratch;
  grid: FlatGrid;
  endX: number;
  endY: number;
  width: number;
  heuristic: (deltaX: number, deltaY: number) => number;
  open: ReturnType<typeof createMinHeap>;
}

/** Process a neighbor cell, updating scratch and open list if the path is better. */
const processNeighbor = (
  context: NeighborProcessContext,
  currentIndex: number,
  neighborStepIndex: number,
  currentX: number,
  currentY: number,
): void => {
  const { scratch, grid, endX, endY, width, heuristic, open } = context;
  const [stepX, stepY, cost] = NEIGHBOR_STEPS[neighborStepIndex];
  const neighborColumn = currentX + stepX;
  const neighborRow = currentY + stepY;

  if (!isWalkable(grid, neighborColumn, neighborRow)) return;

  const neighbor = neighborRow * width + neighborColumn;
  touch(scratch, neighbor);

  if (scratch.state[neighbor] === STATE_CLOSED) return;

  const tentativeG = scratch.g[currentIndex] + cost;
  if (tentativeG >= scratch.g[neighbor]) return;

  scratch.g[neighbor] = tentativeG;
  scratch.parent[neighbor] = currentIndex;
  scratch.state[neighbor] = STATE_OPEN;
  const estimated =
    tentativeG +
    heuristic(Math.abs(neighborColumn - endX), Math.abs(neighborRow - endY));
  open.push(neighbor, estimated);
};

/**
 * A* on a flat grid. Returns `[x, y]` pairs from start to end inclusive, or an
 * empty array when unreachable. Heuristics and step costs match the old
 * object-grid finder so routed paths keep their v4 shapes.
 */
export const findPathAStar = (
  grid: FlatGrid,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  diagonal: boolean,
): number[][] => {
  if (!isWalkable(grid, startX, startY) || !isWalkable(grid, endX, endY)) {
    return [];
  }

  const { width } = grid;
  const scratch = acquireScratch(width * grid.height);
  const heuristic = diagonal ? octile : manhattan;
  const neighborCount = diagonal ? 8 : 4;

  const startIndex = startY * width + startX;
  const endIndex = endY * width + endX;

  const open = createMinHeap();
  touch(scratch, startIndex);
  scratch.g[startIndex] = 0;
  scratch.state[startIndex] = STATE_OPEN;
  open.push(startIndex, 0);

  const context: NeighborProcessContext = {
    scratch,
    grid,
    endX,
    endY,
    width,
    heuristic,
    open,
  };

  while (open.size > 0) {
    const current = open.pop();
    if (scratch.state[current] === STATE_CLOSED) continue; // stale duplicate
    scratch.state[current] = STATE_CLOSED;

    if (current === endIndex) {
      return reconstructPath(scratch, endIndex, width);
    }

    const currentX = current % width;
    const currentY = Math.floor(current / width);

    for (let idx = 0; idx < neighborCount; idx++) {
      processNeighbor(context, current, idx, currentX, currentY);
    }
  }

  return [];
};
