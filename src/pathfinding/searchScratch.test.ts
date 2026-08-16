import { describe, expect, it } from "vitest";
import { acquireScratch, reconstructPath, touch } from "./searchScratch";

describe("searchScratch", () => {
  it("grows to the requested size and bumps generation per acquire", () => {
    const firstScratch = acquireScratch(10);
    const firstGen = firstScratch.generation;
    const secondScratch = acquireScratch(20);
    expect(secondScratch.g.length).toBeGreaterThanOrEqual(20);
    expect(secondScratch.generation).toBe(firstGen + 1);
  });

  it("touch initializes a cell once per generation", () => {
    const scratch = acquireScratch(4);
    touch(scratch, 2);
    scratch.g[2] = 5;
    touch(scratch, 2); // second touch same generation: must not reset
    expect(scratch.g[2]).toBe(5);
    const next = acquireScratch(4);
    touch(next, 2);
    expect(next.g[2]).toBe(Number.POSITIVE_INFINITY);
  });

  it("reconstructs a path from parent indices", () => {
    const scratch = acquireScratch(9); // 3x3 grid, width 3
    // path (0,0) -> (1,0) -> (1,1)
    touch(scratch, 0);
    touch(scratch, 1);
    touch(scratch, 4);
    scratch.parent[1] = 0;
    scratch.parent[4] = 1;
    expect(reconstructPath(scratch, 4, 3)).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
    ]);
  });
});
