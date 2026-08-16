import { afterEach, describe, expect, it } from "vitest";
import {
  expectDragFallbackStyle,
  expectNoDragFallbackStyle,
} from "./storyV5BehaviorHelpers";

const EDGE_ID = "drag-edge";

const mountEdge = (animatedPlaceholder: boolean): HTMLElement => {
  const canvas = document.createElement("div");
  const outer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  outer.setAttribute("class", "react-flow__edge");
  outer.setAttribute("data-testid", `rf__edge-${EDGE_ID}`);
  const parent = animatedPlaceholder
    ? document.createElementNS("http://www.w3.org/2000/svg", "g")
    : outer;
  if (animatedPlaceholder) {
    parent.setAttribute("class", "react-flow__edge animated");
    outer.appendChild(parent);
  }
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", "react-flow__edge-path");
  path.setAttribute("d", "M 0,0 C 10,0 20,10 30,10");
  parent.appendChild(path);
  canvas.appendChild(outer);
  document.body.appendChild(canvas);
  return canvas;
};

describe("story v5 behavior helpers", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("resolves when the edge path sits in a react-flow__edge animated wrapper", async () => {
    const canvas = mountEdge(true);
    const path = await expectDragFallbackStyle(canvas, EDGE_ID);
    expect(path.getAttribute("d")).toBe("M 0,0 C 10,0 20,10 30,10");
  });

  it("resolves expectNoDragFallbackStyle when that wrapper is absent", async () => {
    const canvas = mountEdge(false);
    const path = await expectNoDragFallbackStyle(canvas, EDGE_ID);
    expect(path).toBeTruthy();
  });
});
