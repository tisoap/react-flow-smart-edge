import { describe, expect, it } from "vitest";
import {
  svgDrawSmoothLinePath,
  svgDrawSmoothStepLinePath,
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
    const d = svgDrawSmoothLinePath(source, target, path);
    expect(d.startsWith("M0,0M")).toBe(true);
    expect(d).toContain("Q");
  });

  it("draws an orthogonal smooth-step path with rounded corners", () => {
    const draw = svgDrawSmoothStepLinePath({ borderRadius: 5 });
    const d = draw(source, target, path);
    expect(d.startsWith("M 0,0")).toBe(true);
    expect(d).toContain("Q");
  });
});
