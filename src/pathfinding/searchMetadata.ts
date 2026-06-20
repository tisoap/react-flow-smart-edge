import type { GridNode } from "./grid";

export const estimatedTotalCostOf = (node: GridNode): number =>
  node.estimatedTotalCost ?? Infinity;

export const costFromStartOrZero = (node: GridNode): number =>
  node.costFromStart ?? 0;

export const costFromStartOrInfinity = (node: GridNode): number =>
  node.costFromStart ?? Infinity;

export const selectNodeWithLowestEstimatedTotalCost = (
  openList: GridNode[],
): GridNode => {
  let bestIdx = 0;

  for (let i = 1; i < openList.length; i++) {
    if (
      estimatedTotalCostOf(openList[i]) <
      estimatedTotalCostOf(openList[bestIdx])
    ) {
      bestIdx = i;
    }
  }

  return openList.splice(bestIdx, 1)[0];
};
