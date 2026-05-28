// Orthogonal Jump Point Search (no diagonal movement).
// Algorithm based on PathFinding.js (MIT) — https://github.com/qiao/PathFinding.js

import type { Grid, GridNode } from "./grid";

const manhattan = (dx: number, dy: number): number => dx + dy;

const backtrace = (endNode: GridNode): number[][] => {
  const path: number[][] = [[endNode.x, endNode.y]];
  let node: GridNode | undefined = endNode.parent;

  while (node) {
    path.push([node.x, node.y]);
    node = node.parent;
  }

  return path.reverse();
};

const selectNodeWithLowestEstimatedTotalCost = (
  openList: GridNode[],
): GridNode => {
  let bestIdx = 0;

  for (let i = 1; i < openList.length; i++) {
    if (
      (openList[i].estimatedTotalCost ?? Infinity) <
      (openList[bestIdx].estimatedTotalCost ?? Infinity)
    ) {
      bestIdx = i;
    }
  }

  return openList.splice(bestIdx, 1)[0];
};

const findStartNeighbors = (node: GridNode, grid: Grid): number[][] =>
  grid.getNeighbors(node, "Never").map((n) => [n.x, n.y]);

const findHorizontalNeighbors = (
  grid: Grid,
  x: number,
  y: number,
  dx: number,
): number[][] => {
  const neighbors: number[][] = [];
  if (grid.isWalkableAt(x, y - 1)) neighbors.push([x, y - 1]);
  if (grid.isWalkableAt(x, y + 1)) neighbors.push([x, y + 1]);
  if (grid.isWalkableAt(x + dx, y)) neighbors.push([x + dx, y]);
  return neighbors;
};

const findVerticalNeighbors = (
  grid: Grid,
  x: number,
  y: number,
  dy: number,
): number[][] => {
  const neighbors: number[][] = [];
  if (grid.isWalkableAt(x - 1, y)) neighbors.push([x - 1, y]);
  if (grid.isWalkableAt(x + 1, y)) neighbors.push([x + 1, y]);
  if (grid.isWalkableAt(x, y + dy)) neighbors.push([x, y + dy]);
  return neighbors;
};

const findNeighbors = (node: GridNode, grid: Grid): number[][] => {
  const parent = node.parent;

  if (!parent) {
    return findStartNeighbors(node, grid);
  }

  const { x, y } = node;
  const dx = (x - parent.x) / Math.max(Math.abs(x - parent.x), 1);
  const dy = (y - parent.y) / Math.max(Math.abs(y - parent.y), 1);

  if (dx !== 0) {
    return findHorizontalNeighbors(grid, x, y, dx);
  }

  if (dy !== 0) {
    return findVerticalNeighbors(grid, x, y, dy);
  }

  return [];
};

const hasForcedNeighborHorizontal = (
  grid: Grid,
  x: number,
  y: number,
  dx: number,
): boolean =>
  (grid.isWalkableAt(x, y - 1) && !grid.isWalkableAt(x - dx, y - 1)) ||
  (grid.isWalkableAt(x, y + 1) && !grid.isWalkableAt(x - dx, y + 1));

const hasForcedNeighborVertical = (
  grid: Grid,
  x: number,
  y: number,
  dy: number,
): boolean =>
  (grid.isWalkableAt(x - 1, y) && !grid.isWalkableAt(x - 1, y - dy)) ||
  (grid.isWalkableAt(x + 1, y) && !grid.isWalkableAt(x + 1, y - dy));

const createJump = (grid: Grid, end: GridNode) => {
  const jump: (
    x: number,
    y: number,
    px: number,
    py: number,
  ) => number[] | null = (x, y, px, py) => {
    if (!grid.isWalkableAt(x, y)) {
      return null;
    }

    if (grid.getNodeAt(x, y) === end) {
      return [x, y];
    }

    const dx = x - px;
    const dy = y - py;

    if (dx !== 0 && hasForcedNeighborHorizontal(grid, x, y, dx)) {
      return [x, y];
    }

    if (dy !== 0) {
      if (hasForcedNeighborVertical(grid, x, y, dy)) {
        return [x, y];
      }

      if (jump(x + 1, y, x, y) ?? jump(x - 1, y, x, y)) {
        return [x, y];
      }
    }

    return jump(x + dx, y + dy, x, y);
  };

  return jump;
};

const relaxJumpPoint = (
  jumpNode: GridNode,
  node: GridNode,
  endX: number,
  endY: number,
  jx: number,
  jy: number,
  openList: GridNode[],
): void => {
  const stepCost = manhattan(Math.abs(jx - node.x), Math.abs(jy - node.y));
  const tentativeG = (node.costFromStart ?? 0) + stepCost;

  if (!jumpNode.opened || tentativeG < (jumpNode.costFromStart ?? Infinity)) {
    jumpNode.costFromStart = tentativeG;
    jumpNode.heuristicCostToGoal =
      jumpNode.heuristicCostToGoal ??
      manhattan(Math.abs(jx - endX), Math.abs(jy - endY));
    jumpNode.estimatedTotalCost =
      (jumpNode.costFromStart ?? 0) + (jumpNode.heuristicCostToGoal ?? 0);
    jumpNode.parent = node;

    if (!jumpNode.opened) {
      jumpNode.opened = true;
      openList.push(jumpNode);
    }
  }
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

      for (const [nx, ny] of findNeighbors(node, grid)) {
        const jumpPoint = jump(nx, ny, node.x, node.y);

        if (!jumpPoint) {
          continue;
        }

        const [jx, jy] = jumpPoint;
        const jumpNode = grid.getNodeAt(jx, jy);

        if (jumpNode.closed) {
          continue;
        }

        relaxJumpPoint(jumpNode, node, endX, endY, jx, jy, openList);
      }
    }

    return [];
  };

  return { findPath };
};
