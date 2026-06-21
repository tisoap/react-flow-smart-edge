// Based on https://github.com/qiao/PathFinding.js

import type { Grid, GridNode } from "./grid";
import type { DiagonalMovement } from "./types.ts";
import {
  costFromStartOrInfinity,
  costFromStartOrZero,
  selectNodeWithLowestEstimatedTotalCost,
} from "./searchMetadata";

export interface AStarOptions {
  diagonalMovement?: DiagonalMovement;
  heuristic?: (deltaX: number, deltaY: number) => number;
  weight?: number;
}

const manhattan = (deltaX: number, deltaY: number): number => deltaX + deltaY;

const octile = (deltaX: number, deltaY: number): number => {
  const diagonalFactor = Math.SQRT2 - 1;
  return deltaX < deltaY
    ? diagonalFactor * deltaX + deltaY
    : diagonalFactor * deltaY + deltaX;
};

const reconstructPath = (endNode: GridNode): number[][] => {
  const path: number[][] = [];
  let node: GridNode | undefined = endNode;

  while (node) {
    path.push([node.x, node.y]);
    node = node.parent;
  }

  return path.reverse();
};

const getHeuristic = (
  diagonalMovement: DiagonalMovement,
): ((deltaX: number, deltaY: number) => number) => {
  if (diagonalMovement === "Never") return manhattan;
  return octile;
};

const processNeighbor = (
  neighbor: GridNode,
  current: GridNode,
  end: GridNode,
  openList: GridNode[],
  heuristic: (deltaX: number, deltaY: number) => number,
  weight: number,
): void => {
  if (neighbor.closed) return;

  const deltaX = Math.abs(neighbor.x - current.x);
  const deltaY = Math.abs(neighbor.y - current.y);
  const tentativeG =
    costFromStartOrZero(current) +
    (deltaX === 0 || deltaY === 0 ? 1 : Math.SQRT2);
  const neighborCost = costFromStartOrInfinity(neighbor);

  if (!neighbor.opened || tentativeG < neighborCost) {
    neighbor.costFromStart = tentativeG;

    neighbor.heuristicCostToGoal ??=
      weight *
      heuristic(Math.abs(neighbor.x - end.x), Math.abs(neighbor.y - end.y));

    neighbor.estimatedTotalCost = tentativeG + neighbor.heuristicCostToGoal;

    neighbor.parent = current;

    if (!neighbor.opened) {
      neighbor.opened = true;
      openList.push(neighbor);
    }
  }
};

export const createAStarFinder = (opts: AStarOptions = {}) => {
  const diagonalMovement: DiagonalMovement = opts.diagonalMovement ?? "Never";
  const heuristic = opts.heuristic ?? getHeuristic(diagonalMovement);
  const weight = opts.weight ?? 1;

  const findPath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    grid: Grid,
  ): number[][] => {
    const start = grid.getNodeAt(startX, startY);
    const end = grid.getNodeAt(endX, endY);

    // Open list implemented as a simple array with linear min search for clarity
    const openList: GridNode[] = [];

    start.costFromStart = 0;
    start.heuristicCostToGoal = 0;
    start.estimatedTotalCost = 0;
    start.opened = true;
    openList.push(start);

    while (openList.length > 0) {
      const node = selectNodeWithLowestEstimatedTotalCost(openList);
      node.closed = true;

      if (node === end) {
        return reconstructPath(end);
      }

      const neighbors = grid.getNeighbors(node, diagonalMovement);
      for (const neighbor of neighbors) {
        processNeighbor(neighbor, node, end, openList, heuristic, weight);
      }
    }

    // no path found
    return [];
  };

  return { findPath };
};
