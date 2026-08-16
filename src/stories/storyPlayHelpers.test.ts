import { afterEach, describe, expect, it } from "vitest";
import {
  expectBezierCurves,
  expectEdgePathsMatch,
  expectStraightOrStepPaths,
} from "./storyPlayHelpers";

const FALLBACK_CUBIC = "M 0,0 C 10,0 20,10 30,10";
const ROUTED_QUADRATIC = "M 0,0 Q 15,20 30,10";
const ROUTED_STEP = "M 0,0 L 0,10 L 30,10";

const PATH_MISSING = "path missing";

const mountEdgePath = (pathData: string): HTMLElement => {
  const canvas = document.createElement("div");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", "react-flow__edge-path");
  path.setAttribute("d", pathData);
  canvas.appendChild(path);
  document.body.appendChild(canvas);
  return canvas;
};

const requireMountedPath = (canvas: HTMLElement): SVGPathElement => {
  const path = canvas.querySelector("path");
  if (!path) throw new Error(PATH_MISSING);
  return path;
};

describe("story play helpers", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("waits for a routed quadratic path that appears after the 1s default waitFor budget", async () => {
    const canvas = mountEdgePath(FALLBACK_CUBIC);
    const path = requireMountedPath(canvas);

    window.setTimeout(() => {
      path.setAttribute("d", ROUTED_QUADRATIC);
    }, 1500);

    const matching = await expectBezierCurves(canvas);
    expect(matching[0]?.getAttribute("d")).toBe(ROUTED_QUADRATIC);
  });

  it("polls until step paths lose cubic fallback commands", async () => {
    const canvas = mountEdgePath(FALLBACK_CUBIC);
    const path = requireMountedPath(canvas);

    window.setTimeout(() => {
      path.setAttribute("d", ROUTED_STEP);
    }, 200);

    const paths = await expectStraightOrStepPaths(canvas);
    expect(paths[0]?.getAttribute("d")).toBe(ROUTED_STEP);
  });

  it("keeps waiting when the first edge path exists but does not match yet", async () => {
    const canvas = mountEdgePath(FALLBACK_CUBIC);
    const path = requireMountedPath(canvas);

    window.setTimeout(() => {
      path.setAttribute("d", ROUTED_QUADRATIC);
    }, 200);

    const matching = await expectEdgePathsMatch(canvas, /Q/i);
    expect(matching).toHaveLength(1);
  });
});
