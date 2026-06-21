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

  for (let index = 1; index < openList.length; index++) {
    if (
      estimatedTotalCostOf(openList[index]) <
      estimatedTotalCostOf(openList[bestIdx])
    ) {
      bestIdx = index;
    }
  }

  return openList.splice(bestIdx, 1)[0];
};
