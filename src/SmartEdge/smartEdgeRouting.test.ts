import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import {
  applyFloatingEdgeCoordinates,
  resolveWaypointParams,
} from "./smartEdgeRouting";
import type { Node } from "@xyflow/react";

const rawParams = {
  sourceNodeId: "a",
  targetNodeId: "b",
  sourceX: 100,
  sourceY: 25,
  targetX: 300,
  targetY: 25,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

const measuredNodes: Node[] = [
  {
    id: "a",
    position: { x: 0, y: 0 },
    measured: { width: 100, height: 50 },
    data: {},
  },
  {
    id: "b",
    position: { x: 300, y: 0 },
    measured: { width: 100, height: 50 },
    data: {},
  },
];

describe("applyFloatingEdgeCoordinates", () => {
  it("returns the raw endpoints when floating is disabled", () => {
    const result = applyFloatingEdgeCoordinates({
      floating: false,
      absoluteNodes: measuredNodes,
      ...rawParams,
    });
    expect(result).toMatchObject({ sourceX: 100, targetX: 300 });
  });

  it("returns the raw endpoints when source and target are the same node", () => {
    const result = applyFloatingEdgeCoordinates({
      floating: true,
      absoluteNodes: measuredNodes,
      ...rawParams,
      targetNodeId: "a",
    });
    expect(result).toMatchObject({ sourceX: 100, targetX: 300 });
  });

  it("returns the raw endpoints when the nodes are not measured", () => {
    const unmeasured: Node[] = [
      { id: "a", position: { x: 0, y: 0 }, data: {} },
      { id: "b", position: { x: 300, y: 0 }, data: {} },
    ];
    const result = applyFloatingEdgeCoordinates({
      floating: true,
      absoluteNodes: unmeasured,
      ...rawParams,
    });
    expect(result).toMatchObject({ sourceX: 100, targetX: 300 });
  });

  it("computes floating connection points when the nodes are measured", () => {
    const result = applyFloatingEdgeCoordinates({
      floating: true,
      absoluteNodes: measuredNodes,
      ...rawParams,
    });
    expect(typeof result.sourcePosition).toBe("string");
    expect(typeof result.targetPosition).toBe("string");
  });
});

describe("resolveWaypointParams", () => {
  it("maps active control points when editable", () => {
    const activePoints = [{ id: "wp-1", x: 5, y: 6, active: true }];
    expect(resolveWaypointParams({ editable: true }, {}, activePoints)).toEqual(
      [{ x: 5, y: 6 }],
    );
  });

  it("reads checkpoints from data when checkpoints are enabled", () => {
    expect(
      resolveWaypointParams(
        { checkpoints: true },
        { checkpoints: [{ x: 1, y: 2 }] },
        [],
      ),
    ).toEqual([{ x: 1, y: 2 }]);
  });

  it("returns an empty list when neither mode is enabled", () => {
    expect(
      resolveWaypointParams({}, { checkpoints: [{ x: 1, y: 2 }] }, []),
    ).toEqual([]);
  });
});
