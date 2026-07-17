import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { handleBatchRequest } from "./workerProtocol";
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
