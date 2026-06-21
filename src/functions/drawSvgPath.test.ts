import { describe, expect, it } from "vitest";
import { getSimpleBezierPath, Position } from "@xyflow/react";
import {
  svgDrawSmoothLinePath,
  svgDrawSmoothStepLinePath,
  svgDrawSimpleBezierLinePath,
  svgDrawStraightLinePath,
} from "./drawSvgPath";

describe("drawSvgPath", () => {
  const source = { x: 0, y: 0 };
  const target = { x: 100, y: 50 };
  const path = [
    [20, 0],
    [20, 50],
    [100, 50],
  ];

  it("draws a straight-line path through intermediate points", () => {
    expect(svgDrawStraightLinePath(source, target, path)).toBe(
      "M 0, 0 L 20, 0 L 20, 50 L 100, 50 L 100, 50 ",
    );
  });

  it("draws a smooth bezier path starting at the source", () => {
    const pathData = svgDrawSmoothLinePath(source, target, path);
    expect(pathData.startsWith("M0,0M")).toBe(true);
    expect(pathData).toContain("Q");
  });

  it("draws an orthogonal smooth-step path with rounded corners", () => {
    const draw = svgDrawSmoothStepLinePath({ borderRadius: 5 });
    const pathData = draw(source, target, path);
    expect(pathData.startsWith("M 0,0")).toBe(true);
    expect(pathData).toContain("Q");
  });

  it("skips rounding on collinear smooth-step corners", () => {
    const draw = svgDrawSmoothStepLinePath();
    const collinear = draw({ x: 0, y: 10 }, { x: 100, y: 10 }, [
      [50, 10],
      [100, 10],
    ]);
    expect(collinear).toContain("L 50,10 ");
    expect(collinear).not.toContain("Q 50,10");
  });

  it("rounds horizontal-then-vertical corners in every quadrant", () => {
    const draw = svgDrawSmoothStepLinePath({ borderRadius: 4 });
    const southEast = draw({ x: 0, y: 0 }, { x: 100, y: 100 }, [[0, 50]]);
    const southWest = draw({ x: 100, y: 0 }, { x: 0, y: 100 }, [[100, 50]]);
    const northEast = draw({ x: 0, y: 100 }, { x: 100, y: 0 }, [[0, 50]]);
    const northWest = draw({ x: 100, y: 100 }, { x: 0, y: 0 }, [[100, 50]]);

    expect(southEast).toContain("Q");
    expect(southWest).toContain("Q");
    expect(northEast).toContain("Q");
    expect(northWest).toContain("Q");
  });

  it("dedupes consecutive duplicate points before drawing smooth steps", () => {
    const draw = svgDrawSmoothStepLinePath();
    const pathData = draw({ x: 0, y: 0 }, { x: 100, y: 0 }, [
      [0, 0],
      [50, 0],
    ]);
    expect(pathData).toBe("M 0,0 L 50,0 L 100,0 ");
  });

  it("matches getSimpleBezierPath when there are no intermediate points", () => {
    const source = {
      x: 0,
      y: 0,
      position: Position.Right,
    };
    const target = {
      x: 100,
      y: 50,
      position: Position.Left,
    };
    const [expectedPath] = getSimpleBezierPath({
      sourceX: source.x,
      sourceY: source.y,
      sourcePosition: source.position,
      targetX: target.x,
      targetY: target.y,
      targetPosition: target.position,
    });

    expect(svgDrawSimpleBezierLinePath(source, target, [])).toBe(expectedPath);
  });

  it("draws chained cubic bezier segments through intermediate points", () => {
    const source = {
      x: 0,
      y: 0,
      position: Position.Bottom,
    };
    const target = {
      x: 100,
      y: 50,
      position: Position.Top,
    };
    const pathData = svgDrawSimpleBezierLinePath(source, target, [
      [20, 0],
      [20, 50],
    ]);

    expect(pathData.startsWith("M0,0")).toBe(true);
    expect(pathData).toContain(" C");
    expect(pathData.split(" C").length).toBeGreaterThan(2);
  });

  it("uses horizontal handle controls for left/right positions", () => {
    const source = {
      x: 0,
      y: 10,
      position: Position.Right,
    };
    const target = {
      x: 100,
      y: 10,
      position: Position.Left,
    };

    expect(svgDrawSimpleBezierLinePath(source, target, [])).toBe(
      "M0,10 C50,10 50,10 100,10",
    );
  });

  it("uses vertical handle controls for top/bottom positions", () => {
    const source = {
      x: 10,
      y: 0,
      position: Position.Bottom,
    };
    const target = {
      x: 10,
      y: 100,
      position: Position.Top,
    };

    expect(svgDrawSimpleBezierLinePath(source, target, [])).toBe(
      "M10,0 C10,50 10,50 10,100",
    );
  });
});
