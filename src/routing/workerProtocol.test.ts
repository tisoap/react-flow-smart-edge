import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { handleBatchRequest, isSmartEdgeBatchRequest } from "./workerProtocol";
import type { Node } from "@xyflow/react";

const nodes: Node[] = [
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

describe("handleBatchRequest", () => {
  it("echoes the requestId and reports a non-negative durationMs", () => {
    const response = handleBatchRequest({
      requestId: 7,
      nodes,
      edges: [
        {
          id: "e1",
          source: "a",
          target: "b",
          sourceX: 100,
          sourceY: 25,
          targetX: 300,
          targetY: 25,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          preset: "bezier",
        },
      ],
    });

    expect(response.requestId).toBe(7);
    expect(response.durationMs).toBeGreaterThanOrEqual(0);
    expect(response.results["e1"]).toMatchObject({
      kind: "routed",
      wasRouted: true,
    });
  });
});

describe("isSmartEdgeBatchRequest", () => {
  it("rejects webpack HMR messages that have no nodes array", () => {
    expect(isSmartEdgeBatchRequest({ type: "webpackOk" })).toBe(false);
  });

  it("rejects null and non-objects", () => {
    expect(isSmartEdgeBatchRequest(null)).toBe(false);
    expect(isSmartEdgeBatchRequest(undefined)).toBe(false);
    expect(isSmartEdgeBatchRequest("webpackOk")).toBe(false);
  });

  it("rejects payloads whose requestId, nodes, or edges have the wrong type", () => {
    expect(
      isSmartEdgeBatchRequest({ requestId: "1", nodes: [], edges: [] }),
    ).toBe(false);
    expect(
      isSmartEdgeBatchRequest({ requestId: 1, nodes: {}, edges: [] }),
    ).toBe(false);
    expect(
      isSmartEdgeBatchRequest({ requestId: 1, nodes: [], edges: {} }),
    ).toBe(false);
  });

  it("accepts a structured-clone batch request", () => {
    expect(
      isSmartEdgeBatchRequest({ requestId: 1, nodes: [], edges: [] }),
    ).toBe(true);
  });
});
