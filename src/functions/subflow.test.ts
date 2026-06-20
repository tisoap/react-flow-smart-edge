import { describe, expect, it } from "vitest";
import { excludeEdgeAncestorNodes, getAbsoluteNodes } from "./subflow";
import type { Node } from "@xyflow/react";

describe("subflow helpers", () => {
  const subFlowNodes: Node[] = [
    {
      id: "parent",
      position: { x: 200, y: 100 },
      data: {},
      style: { width: 400, height: 300 },
    },
    {
      id: "child",
      position: { x: 50, y: 80 },
      parentId: "parent",
      data: {},
    },
    {
      id: "outside",
      position: { x: 20, y: 20 },
      data: {},
    },
  ];

  it("resolves child positions to absolute coordinates", () => {
    const absolute = getAbsoluteNodes(subFlowNodes);
    const child = absolute.find((node) => node.id === "child");

    expect(child?.position).toEqual({ x: 250, y: 180 });
  });

  it("excludes ancestor containers of the edge endpoints", () => {
    const filtered = excludeEdgeAncestorNodes(subFlowNodes, "child", "outside");

    expect(filtered.map((node) => node.id)).toEqual(["child", "outside"]);
  });
});
