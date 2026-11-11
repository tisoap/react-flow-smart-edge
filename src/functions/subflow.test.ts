import { describe, expect, it } from "vitest";
import {
  buildParentIdLookup,
  excludeEdgeAncestorNodes,
  getAbsoluteNodes,
  getEdgeAncestorIds,
} from "./subflow";
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
    const filtered = excludeEdgeAncestorNodes(
      subFlowNodes,
      "child",
      "outside",
      buildParentIdLookup(subFlowNodes),
    );

    expect(filtered.map((node) => node.id)).toEqual(["child", "outside"]);
  });

  it("excludes the container when the target is inside the subflow", () => {
    const filtered = excludeEdgeAncestorNodes(
      subFlowNodes,
      "outside",
      "child",
      buildParentIdLookup(subFlowNodes),
    );

    expect(filtered.map((node) => node.id)).toEqual(["child", "outside"]);
  });

  it("returns the same node list when neither endpoint has a container", () => {
    const filtered = excludeEdgeAncestorNodes(
      subFlowNodes,
      "outside",
      "parent",
      buildParentIdLookup(subFlowNodes),
    );

    expect(filtered).toBe(subFlowNodes);
  });

  it("stops resolving parents when the parent id is missing", () => {
    const nodes: Node[] = [
      {
        id: "orphan",
        parentId: "missing-parent",
        position: { x: 12, y: 34 },
        data: {},
      },
    ];

    expect(getAbsoluteNodes(nodes)[0].position).toEqual({ x: 12, y: 34 });
  });
});

describe("getEdgeAncestorIds", () => {
  /** Builds nodes from `[id, parentId?]` pairs; a missing parent means the
   * node is top-level. */
  const nested = (...entries: [nodeId: string, parentId?: string][]): Node[] =>
    entries.map(([nodeId, parentId]) => ({
      id: nodeId,
      ...(parentId ? { parentId } : {}),
      position: { x: 0, y: 0 },
      data: {},
    }));

  const ancestorsOf = (
    nodes: Node[],
    sourceId: string,
    targetId: string,
  ): string[] =>
    getEdgeAncestorIds(sourceId, targetId, buildParentIdLookup(nodes));

  it("returns nothing for two top-level nodes", () => {
    const nodes = nested(["a"], ["b"]);

    expect(ancestorsOf(nodes, "a", "b")).toEqual([]);
  });

  it("walks the whole parent chain, nearest container first", () => {
    const nodes = nested(
      ["outer"],
      ["inner", "outer"],
      ["a", "inner"],
      ["b", "inner"],
    );

    expect(ancestorsOf(nodes, "a", "b")).toEqual(["inner", "outer"]);
  });

  it("merges both endpoints' chains without duplicates, source chain first", () => {
    const nodes = nested(
      ["root"],
      ["left", "root"],
      ["right", "root"],
      ["a", "left"],
      ["b", "right"],
    );

    expect(ancestorsOf(nodes, "a", "b")).toEqual(["left", "root", "right"]);
    expect(ancestorsOf(nodes, "b", "a")).toEqual(["right", "root", "left"]);
  });

  it("includes the container of a single nested endpoint", () => {
    const nodes = nested(["group"], ["a"], ["b", "group"]);

    expect(ancestorsOf(nodes, "a", "b")).toEqual(["group"]);
  });

  it("lists a container endpoint only through its child's chain", () => {
    const nodes = nested(["group"], ["child", "group"]);

    expect(ancestorsOf(nodes, "group", "child")).toEqual(["group"]);
    expect(ancestorsOf(nodes, "group", "group")).toEqual([]);
  });

  it("terminates on a parentId cycle", () => {
    const nodes = nested(["a", "b"], ["b", "a"]);

    expect(ancestorsOf(nodes, "a", "b")).toEqual(["b", "a"]);
  });

  it("keeps a parent id that is missing from the node list and stops there", () => {
    const nodes = nested(["a", "ghost"], ["b"]);

    expect(ancestorsOf(nodes, "a", "b")).toEqual(["ghost"]);
  });

  it("returns nothing for endpoints that are not in the lookup", () => {
    expect(ancestorsOf([], "a", "b")).toEqual([]);
  });
});
