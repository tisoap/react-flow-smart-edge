// Legacy v4 engine kept for A/B benchmarks only — deleted before release.
// Orthogonal Jump Point Search (no diagonal movement).
// Algorithm based on PathFinding.js (MIT) — https://github.com/qiao/PathFinding.js

import type { Grid, GridNode } from "./grid";
import {
  costFromStartOrInfinity,
  costFromStartOrZero,
  selectNodeWithLowestEstimatedTotalCost,
} from "./searchMetadata";

const backtrace = (endNode: GridNode): number[][] => {
  const path: number[][] = [[endNode.x, endNode.y]];
  let node: GridNode | undefined = endNode.parent;

  while (node) {
    path.push([node.x, node.y]);
    node = node.parent;
  }

  return path.reverse();
};

const manhattan = (deltaX: number, deltaY: number): number => deltaX + deltaY;

const findStartNeighbors = (node: GridNode, grid: Grid): number[][] =>
  grid.getNeighbors(node, "Never").map((neighbor) => [neighbor.x, neighbor.y]);

const findHorizontalNeighbors = (
  grid: Grid,
  column: number,
  row: number,
  deltaX: number,
): number[][] => {
  const neighbors: number[][] = [];
  if (grid.isWalkableAt(column, row - 1)) neighbors.push([column, row - 1]);
  if (grid.isWalkableAt(column, row + 1)) neighbors.push([column, row + 1]);
  if (grid.isWalkableAt(column + deltaX, row))
    neighbors.push([column + deltaX, row]);
  return neighbors;
};

const findVerticalNeighbors = (
  grid: Grid,
  column: number,
  row: number,
  deltaY: number,
): number[][] => {
  const neighbors: number[][] = [];
  if (grid.isWalkableAt(column - 1, row)) neighbors.push([column - 1, row]);
  if (grid.isWalkableAt(column + 1, row)) neighbors.push([column + 1, row]);
  if (grid.isWalkableAt(column, row + deltaY))
    neighbors.push([column, row + deltaY]);
  return neighbors;
};

const findNeighbors = (node: GridNode, grid: Grid): number[][] => {
  const parent = node.parent;

  if (!parent) {
    return findStartNeighbors(node, grid);
  }

  const column = node.x;
  const row = node.y;
  const deltaX = (column - parent.x) / Math.max(Math.abs(column - parent.x), 1);
  const deltaY = (row - parent.y) / Math.max(Math.abs(row - parent.y), 1);

  if (deltaX !== 0) {
    return findHorizontalNeighbors(grid, column, row, deltaX);
  }

  if (deltaY !== 0) {
    return findVerticalNeighbors(grid, column, row, deltaY);
  }

  return [];
};

const hasForcedNeighborHorizontal = (
  grid: Grid,
  column: number,
  row: number,
  deltaX: number,
): boolean =>
  (grid.isWalkableAt(column, row - 1) &&
    !grid.isWalkableAt(column - deltaX, row - 1)) ||
  (grid.isWalkableAt(column, row + 1) &&
    !grid.isWalkableAt(column - deltaX, row + 1));

const hasForcedNeighborVertical = (
  grid: Grid,
  column: number,
  row: number,
  deltaY: number,
): boolean =>
  (grid.isWalkableAt(column - 1, row) &&
    !grid.isWalkableAt(column - 1, row - deltaY)) ||
  (grid.isWalkableAt(column + 1, row) &&
    !grid.isWalkableAt(column + 1, row - deltaY));

const createJump = (grid: Grid, end: GridNode) => {
  const jump: (
    column: number,
    row: number,
    parentColumn: number,
    parentRow: number,
  ) => number[] | null = (column, row, parentColumn, parentRow) => {
    if (!grid.isWalkableAt(column, row)) {
      return null;
    }

    if (grid.getNodeAt(column, row) === end) {
      return [column, row];
    }

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

const relaxJumpPoint = (
  jumpNode: GridNode,
  node: GridNode,
  endX: number,
  endY: number,
  jumpX: number,
  jumpY: number,
  openList: GridNode[],
): void => {
  const stepCost = manhattan(
    Math.abs(jumpX - node.x),
    Math.abs(jumpY - node.y),
  );
  const tentativeG = costFromStartOrZero(node) + stepCost;
  const jumpNodeCost = costFromStartOrInfinity(jumpNode);

  if (!jumpNode.opened || tentativeG < jumpNodeCost) {
    jumpNode.costFromStart = tentativeG;

    jumpNode.heuristicCostToGoal ??= manhattan(
      Math.abs(jumpX - endX),
      Math.abs(jumpY - endY),
    );

    jumpNode.estimatedTotalCost = tentativeG + jumpNode.heuristicCostToGoal;

    jumpNode.parent = node;

    if (!jumpNode.opened) {
      jumpNode.opened = true;
      openList.push(jumpNode);
    }
  }
};

const relaxNeighborJump = (
  neighborX: number,
  neighborY: number,
  node: GridNode,
  endX: number,
  endY: number,
  grid: Grid,
  jump: ReturnType<typeof createJump>,
  openList: GridNode[],
) => {
  const jumpPoint = jump(neighborX, neighborY, node.x, node.y);

  if (!jumpPoint) {
    return;
  }

  const [jumpX, jumpY] = jumpPoint;
  const jumpNode = grid.getNodeAt(jumpX, jumpY);

  if (jumpNode.closed) {
    return;
  }

  relaxJumpPoint(jumpNode, node, endX, endY, jumpX, jumpY, openList);
};

export const createJumpPointFinder = () => {
  const findPath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    grid: Grid,
  ): number[][] => {
    const start = grid.getNodeAt(startX, startY);
    const end = grid.getNodeAt(endX, endY);
    const openList: GridNode[] = [];
    const jump = createJump(grid, end);

    start.costFromStart = 0;
    start.heuristicCostToGoal = 0;
    start.estimatedTotalCost = 0;
    start.opened = true;
    openList.push(start);

    while (openList.length > 0) {
      const node = selectNodeWithLowestEstimatedTotalCost(openList);
      node.closed = true;

      if (node === end) {
        return backtrace(end);
      }

      for (const [neighborX, neighborY] of findNeighbors(node, grid)) {
        relaxNeighborJump(
          neighborX,
          neighborY,
          node,
          endX,
          endY,
          grid,
          jump,
          openList,
        );
      }
    }

    return [];
  };

  return { findPath };
};
