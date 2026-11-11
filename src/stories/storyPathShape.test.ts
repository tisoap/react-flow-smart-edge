import { afterEach, describe, expect, it } from "vitest";
import {
  assertSamePathShape,
  expectSamePathShape,
  pathShapeOf,
} from "./storyPathShape";

const SVG_NS = "http://www.w3.org/2000/svg";
const ROUTED = "M 135,80 L 135,95 Q 135,100 130,105 L 40,195 Q 35,200 35,205";
const ROUTED_MOVED =
  "M 775,80 L 775,95 Q 775,100 770,105 L 680,195 Q 675,200 675,205";
const ROUTED_OTHER_SIDE =
  "M 775,80 L 775,95 Q 775,100 780,105 L 870,195 Q 875,200 875,205";
const NATIVE = "M375,80 C375,190 435,190 435,300";

const mountEdges = (pathDataByEdgeId: Record<string, string>): HTMLElement => {
  const canvas = document.createElement("div");
  Object.entries(pathDataByEdgeId).forEach(([edgeId, pathData]) => {
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-testid", `rf__edge-${edgeId}`);
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "react-flow__edge-path");
    path.setAttribute("d", pathData);
    group.appendChild(path);
    canvas.appendChild(group);
  });
  document.body.appendChild(canvas);
  return canvas;
};

describe("pathShapeOf", () => {
  it("splits a path into its commands, origin, and origin-relative offsets", () => {
    expect(pathShapeOf("M 10,20 L 10,50 Q 10,60 20,60")).toEqual({
      commands: "MLQ",
      origin: { x: 10, y: 20 },
      offsets: [0, 0, 0, 30, 0, 40, 10, 40],
    });
  });

  it("reads compact, negative, decimal, and exponent coordinates", () => {
    expect(pathShapeOf("M-5.5,1e1L.5-2")).toEqual({
      commands: "ML",
      origin: { x: -5.5, y: 10 },
      offsets: [0, 0, 6, -12],
    });
  });

  it("gives a translated copy of a path the same shape", () => {
    const original = pathShapeOf(ROUTED);
    const moved = pathShapeOf(ROUTED_MOVED);

    expect(moved.commands).toBe(original.commands);
    expect(moved.offsets).toEqual(original.offsets);
    expect(moved.origin).toEqual({ x: 775, y: 80 });
  });

  it("rejects a path without a starting point", () => {
    expect(() => pathShapeOf("")).toThrow(/no starting point/);
  });
});

describe("assertSamePathShape", () => {
  it("accepts a translated copy, with or without checking the translation", () => {
    expect(() => {
      assertSamePathShape(ROUTED, ROUTED_MOVED);
      assertSamePathShape(ROUTED, ROUTED_MOVED, {
        translation: { x: 640, y: 0 },
      });
    }).not.toThrow();
  });

  it("accepts differences within the tolerance only", () => {
    const nudged = ROUTED_MOVED.replace("770,105", "770.4,105");

    expect(() => {
      assertSamePathShape(ROUTED, nudged);
    }).not.toThrow();
    expect(() => {
      assertSamePathShape(ROUTED, nudged, { tolerance: 0.1 });
    }).toThrow(/diverge at coordinate 6/);
  });

  it("rejects a path that detours on the other side", () => {
    expect(() => {
      assertSamePathShape(ROUTED, ROUTED_OTHER_SIDE);
    }).toThrow(/diverge at coordinate 6/);
  });

  it("rejects a routed path compared against a native one", () => {
    expect(() => {
      assertSamePathShape(ROUTED, NATIVE);
    }).toThrow(/different commands/);
  });

  it("rejects the same commands with a different number of coordinates", () => {
    expect(() => {
      assertSamePathShape("M 0,0 L 10,10", "M 0,0 L 10,10 20,20");
    }).toThrow(/different commands/);
  });

  it("rejects the same shape drawn at the wrong place", () => {
    expect(() => {
      assertSamePathShape(ROUTED, ROUTED_MOVED, {
        translation: { x: 600, y: 0 },
      });
    }).toThrow(/640,0 apart, expected 600,0/);
    expect(() => {
      assertSamePathShape(ROUTED, ROUTED_MOVED, {
        translation: { x: 640, y: 10 },
      });
    }).toThrow(/640,0 apart, expected 640,10/);
  });
});

describe("expectSamePathShape", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("resolves once both rendered edges draw the same shape", async () => {
    const canvas = mountEdges({ left: ROUTED, right: NATIVE });
    const rightPath = canvas.querySelector(
      '[data-testid="rf__edge-right"] path',
    );

    window.setTimeout(() => {
      rightPath?.setAttribute("d", ROUTED_MOVED);
    }, 50);

    await expect(
      expectSamePathShape(canvas, "left", "right", {
        translation: { x: 640, y: 0 },
      }),
    ).resolves.toBeUndefined();
  });
});
