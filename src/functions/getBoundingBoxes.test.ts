import { describe, expect, it } from "vitest";
import { getBoundingBoxes } from "./getBoundingBoxes";
import type { Node } from "@xyflow/react";

const testNode = (
  id: string,
  x: number,
  y: number,
  width = 100,
  height = 50,
): Node => ({
  id,
  position: { x, y },
  measured: { width, height },
  data: {},
});

describe("getBoundingBoxes", () => {
  it("builds padded node boxes and a graph box around them", () => {
    const nodes = [testNode("a", 100, 100), testNode("b", 300, 200)];
    const { nodeBoxes, graphBox } = getBoundingBoxes(nodes, 10, 10);

    expect(nodeBoxes).toHaveLength(2);
    expect(nodeBoxes[0].topLeft.x).toBeLessThan(100);
    expect(nodeBoxes[1].bottomRight.y).toBeGreaterThan(250);

    expect(graphBox.xMin).toBeLessThanOrEqual(nodeBoxes[0].topLeft.x);
    expect(graphBox.xMax).toBeGreaterThanOrEqual(nodeBoxes[1].bottomRight.x);
  });

  it("skips grid rounding when roundTo is zero", () => {
    const nodes = [testNode("a", 103, 107)];
    const { nodeBoxes } = getBoundingBoxes(nodes, 10, 0);

    expect(nodeBoxes[0].topLeft).toEqual({ x: 93, y: 97 });
  });

  it("falls back to 1px dimensions when measured sizes are missing", () => {
    const nodes: Node[] = [
      {
        id: "bare",
        position: { x: 10, y: 20 },
        data: {},
      },
    ];
    const { nodeBoxes } = getBoundingBoxes(nodes, 0, 0);

    expect(nodeBoxes[0].width).toBe(1);
    expect(nodeBoxes[0].height).toBe(1);
  });

  it("includes avoid areas as extra obstacles", () => {
    const nodes = [testNode("a", 0, 0)];
    const { avoidBoxes } = getBoundingBoxes(nodes, 10, 10, [
      { x: 500, y: 500, width: 80, height: 40 },
    ]);

    expect(avoidBoxes).toHaveLength(1);
    expect(avoidBoxes[0].id).toBe("avoid-0");
  });

  it("expands the graph box to cover extra endpoint points", () => {
    const nodes = [testNode("a", 100, 100)];
    const { graphBox } = getBoundingBoxes(
      nodes,
      10,
      10,
      [],
      [{ x: 900, y: 900 }],
    );

    expect(graphBox.xMax).toBeGreaterThanOrEqual(900);
    expect(graphBox.yMax).toBeGreaterThanOrEqual(900);
  });
});
