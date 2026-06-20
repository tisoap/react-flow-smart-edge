import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { alignEndpoints } from "./alignEndpoints";

describe("alignEndpoints", () => {
  it("returns an empty path unchanged", () => {
    expect(
      alignEndpoints(
        { x: 0, y: 0, position: Position.Top },
        { x: 100, y: 100, position: Position.Bottom },
        [],
      ),
    ).toEqual([]);
  });

  it("aligns the leading run on X for a bottom handle", () => {
    const source = { x: 303, y: 47, position: Position.Bottom };
    const target = { x: 88, y: 247, position: Position.Top };
    const graphPath = [
      [300, 100],
      [300, 150],
      [200, 150],
      [100, 200],
      [90, 200],
    ];

    const aligned = alignEndpoints(source, target, graphPath);

    expect(aligned[0]).toEqual([303, 100]);
    expect(aligned[1]).toEqual([303, 150]);
    expect(aligned[aligned.length - 1]).toEqual([88, 200]);
  });

  it("aligns the leading run on Y for a right handle", () => {
    const source = { x: 160, y: 137, position: Position.Right };
    const target = { x: 580, y: 73, position: Position.Left };
    const graphPath = [
      [150, 140],
      [200, 140],
      [200, 100],
      [570, 100],
      [570, 70],
    ];

    const aligned = alignEndpoints(source, target, graphPath);

    expect(aligned[0]).toEqual([150, 137]);
    expect(aligned[aligned.length - 1]).toEqual([570, 73]);
  });

  it("aligns the trailing run on X for a bottom handle", () => {
    const source = { x: 0, y: 0, position: Position.Right };
    const target = { x: 100, y: 200, position: Position.Bottom };
    const graphPath = [
      [0, 0],
      [50, 0],
      [50, 180],
      [100, 180],
      [100, 190],
    ];

    const aligned = alignEndpoints(source, target, graphPath);
    expect(aligned[aligned.length - 1]).toEqual([100, 190]);
  });

  it("keeps trailing alignment from overlapping the leading rewrite", () => {
    const source = { x: 10, y: 10, position: Position.Top };
    const target = { x: 10, y: 90, position: Position.Bottom };
    const graphPath = [
      [10, 20],
      [10, 40],
      [10, 60],
      [10, 80],
    ];

    const aligned = alignEndpoints(source, target, graphPath);
    expect(aligned[0][0]).toBe(10);
    expect(aligned.at(-1)?.[0]).toBe(10);
  });
});
