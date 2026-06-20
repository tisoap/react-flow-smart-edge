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
    const se = draw({ x: 0, y: 0 }, { x: 100, y: 100 }, [[0, 50]]);
    const sw = draw({ x: 100, y: 0 }, { x: 0, y: 100 }, [[100, 50]]);
    const ne = draw({ x: 0, y: 100 }, { x: 100, y: 0 }, [[0, 50]]);
    const nw = draw({ x: 100, y: 100 }, { x: 0, y: 0 }, [[100, 50]]);

    expect(se).toContain("Q");
    expect(sw).toContain("Q");
    expect(ne).toContain("Q");
    expect(nw).toContain("Q");
  });

  it("dedupes consecutive duplicate points before drawing smooth steps", () => {
    const draw = svgDrawSmoothStepLinePath();
    const d = draw({ x: 0, y: 0 }, { x: 100, y: 0 }, [
      [0, 0],
      [50, 0],
    ]);
    expect(d).toBe("M 0,0 L 50,0 L 100,0 ");
  });
});
