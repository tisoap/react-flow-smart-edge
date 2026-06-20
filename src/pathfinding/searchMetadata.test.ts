import { describe, expect, it } from "vitest";
import type { GridNode } from "./grid";
import {
  costFromStartOrInfinity,
  costFromStartOrZero,
  estimatedTotalCostOf,
  selectNodeWithLowestEstimatedTotalCost,
} from "./searchMetadata";

const node = (overrides: Partial<GridNode> = {}): GridNode => ({
  x: 0,
  y: 0,
  walkable: true,
  ...overrides,
});

describe("searchMetadata", () => {
  it("reads estimated total cost fallbacks", () => {
    expect(estimatedTotalCostOf(node())).toBe(Infinity);
    expect(estimatedTotalCostOf(node({ estimatedTotalCost: 4 }))).toBe(4);
  });

  it("reads cost-from-start fallbacks", () => {
    expect(costFromStartOrZero(node())).toBe(0);
    expect(costFromStartOrZero(node({ costFromStart: 2 }))).toBe(2);
    expect(costFromStartOrInfinity(node())).toBe(Infinity);
    expect(costFromStartOrInfinity(node({ costFromStart: 2 }))).toBe(2);
  });

  it("selects the lowest-cost open node", () => {
    const openList = [
      node({ estimatedTotalCost: 5 }),
      node({ estimatedTotalCost: 2 }),
      node(),
    ];

    const selected = selectNodeWithLowestEstimatedTotalCost(openList);

    expect(selected.estimatedTotalCost).toBe(2);
    expect(openList).toHaveLength(2);
  });
});
