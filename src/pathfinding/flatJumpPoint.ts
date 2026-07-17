// Orthogonal Jump Point Search on a flat grid.
// Algorithm based on PathFinding.js (MIT) — https://github.com/qiao/PathFinding.js

import { createMinHeap } from "./binaryHeap";
import { isWalkable } from "./flatGrid";
import type { FlatGrid } from "./flatGrid";
import {
  acquireScratch,
  reconstructPath,
  touch,
  STATE_CLOSED,
  STATE_OPEN,
} from "./searchScratch";
import type { SearchScratch } from "./searchScratch";

const manhattan = (deltaX: number, deltaY: number): number => deltaX + deltaY;

const pushNeighbor = (
  grid: FlatGrid,
  out: number[][],
  column: number,
  row: number,
): void => {
  if (isWalkable(grid, column, row)) out.push([column, row]);
};

/**
 * Pruned neighbors given the direction of travel from the parent.
 * Returns only walkable cells that are part of the search direction.
 */
const findNeighbors = (
  grid: FlatGrid,
  scratch: SearchScratch,
  index: number,
): number[][] => {
  const width = grid.width;
  const column = index % width;
  const row = Math.floor(index / width);
  const parent = scratch.parent[index];
  const neighbors: number[][] = [];

  if (parent === -1) {
    pushNeighbor(grid, neighbors, column, row - 1);
    pushNeighbor(grid, neighbors, column + 1, row);
    pushNeighbor(grid, neighbors, column, row + 1);
    pushNeighbor(grid, neighbors, column - 1, row);
    return neighbors;
  }

  const parentColumn = parent % width;
  const parentRow = Math.floor(parent / width);
  const deltaX =
    (column - parentColumn) / Math.max(Math.abs(column - parentColumn), 1);
  const deltaY = (row - parentRow) / Math.max(Math.abs(row - parentRow), 1);

  if (deltaX !== 0) {
    pushNeighbor(grid, neighbors, column, row - 1);
    pushNeighbor(grid, neighbors, column, row + 1);
    pushNeighbor(grid, neighbors, column + deltaX, row);
  } else if (deltaY !== 0) {
    pushNeighbor(grid, neighbors, column - 1, row);
    pushNeighbor(grid, neighbors, column + 1, row);
    pushNeighbor(grid, neighbors, column, row + deltaY);
  } else {
    // Both deltaX and deltaY are 0, which cannot occur since parent !== current,
    // but this else clause is required for the sonarjs rule.
  }

  return neighbors;
};

const hasForcedNeighborHorizontal = (
  grid: FlatGrid,
  column: number,
  row: number,
  deltaX: number,
): boolean =>
  (isWalkable(grid, column, row - 1) &&
    !isWalkable(grid, column - deltaX, row - 1)) ||
  (isWalkable(grid, column, row + 1) &&
    !isWalkable(grid, column - deltaX, row + 1));

const hasForcedNeighborVertical = (
  grid: FlatGrid,
  column: number,
  row: number,
  deltaY: number,
): boolean =>
  (isWalkable(grid, column - 1, row) &&
    !isWalkable(grid, column - 1, row - deltaY)) ||
  (isWalkable(grid, column + 1, row) &&
    !isWalkable(grid, column + 1, row - deltaY));

const createJump = (grid: FlatGrid, endColumn: number, endRow: number) => {
  const jump = (
    column: number,
    row: number,
    parentColumn: number,
    parentRow: number,
  ): number[] | null => {
    if (!isWalkable(grid, column, row)) return null;
    if (column === endColumn && row === endRow) return [column, row];

    const deltaX = column - parentColumn;
    const deltaY = row - parentRow;

    if (
      deltaX !== 0 &&
      hasForcedNeighborHorizontal(grid, column, row, deltaX)
    ) {
      return [column, row];
    }

    if (deltaY !== 0) {
      if (hasForcedNeighborVertical(grid, column, row, deltaY)) {
        return [column, row];
      }
      if (
        jump(column + 1, row, column, row) ??
        jump(column - 1, row, column, row)
      ) {
        return [column, row];
      }
    }

    return jump(column + deltaX, row + deltaY, column, row);
  };

  return jump;
};

interface ProcessJumpContext {
  scratch: SearchScratch;
  endColumn: number;
  endRow: number;
  width: number;
  jump: (
    col: number,
    row: number,
    parentCol: number,
    parentRow: number,
  ) => number[] | null;
  open: ReturnType<typeof createMinHeap>;
}

const processJumpNeighbor = (
  context: ProcessJumpContext,
  currentIndex: number,
  neighborColumn: number,
  neighborRow: number,
  currentColumn: number,
  currentRow: number,
): void => {
  const { scratch, endColumn, endRow, width, jump, open } = context;

  const jumpPoint = jump(
    neighborColumn,
    neighborRow,
    currentColumn,
    currentRow,
  );
  if (!jumpPoint) return;

  const [jumpColumn, jumpRow] = jumpPoint;
  const jumpIndex = jumpRow * width + jumpColumn;
  touch(scratch, jumpIndex);
  if (scratch.state[jumpIndex] === STATE_CLOSED) return;

  const stepCost = manhattan(
    Math.abs(jumpColumn - currentColumn),
    Math.abs(jumpRow - currentRow),
  );
  const tentativeG = scratch.g[currentIndex] + stepCost;
  if (tentativeG >= scratch.g[jumpIndex]) return;

  scratch.g[jumpIndex] = tentativeG;
  scratch.parent[jumpIndex] = currentIndex;
  scratch.state[jumpIndex] = STATE_OPEN;
  open.push(
    jumpIndex,
    tentativeG +
      manhattan(Math.abs(jumpColumn - endColumn), Math.abs(jumpRow - endRow)),
  );
};

/**
 * Orthogonal Jump Point Search on a flat grid. Returns jump points only
 * (expanded to full cell sequence downstream by alignEndpoints/draw functions).
 * Empty array when unreachable.
 */
export const findPathJumpPoint = (
  grid: FlatGrid,
  startColumn: number,
  startRow: number,
  endColumn: number,
  endRow: number,
): number[][] => {
  if (
    !isWalkable(grid, startColumn, startRow) ||
    !isWalkable(grid, endColumn, endRow)
  ) {
    return [];
  }

  const width = grid.width;
  const scratch = acquireScratch(width * grid.height);
  const startIndex = startRow * width + startColumn;
  const endIndex = endRow * width + endColumn;
  const open = createMinHeap();
  const jump = createJump(grid, endColumn, endRow);

  touch(scratch, startIndex);
  scratch.g[startIndex] = 0;
  scratch.state[startIndex] = STATE_OPEN;
  open.push(startIndex, 0);

  const context: ProcessJumpContext = {
    scratch,
    endColumn,
    endRow,
    width,
    jump,
    open,
  };

  while (open.size > 0) {
    const current = open.pop();
    if (scratch.state[current] === STATE_CLOSED) continue;
    scratch.state[current] = STATE_CLOSED;

    if (current === endIndex) {
      return reconstructPath(scratch, endIndex, width);
    }

    const currentColumn = current % width;
    const currentRow = Math.floor(current / width);

    for (const [neighborColumn, neighborRow] of findNeighbors(
      grid,
      scratch,
      current,
    )) {
      processJumpNeighbor(
        context,
        current,
        neighborColumn,
        neighborRow,
        currentColumn,
        currentRow,
      );
    }
  }

  return [];
};
