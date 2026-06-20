import { Position, ReactFlowProvider } from "@xyflow/react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import * as getSmartEdgeModule from "../getSmartEdge";
import * as getSmartEdgeWaypointsModule from "../getSmartEdge/getSmartEdgeWaypoints";
import { SmartEdge } from "./index";
import type { Node } from "@xyflow/react";

const setEdges = vi.fn();

vi.mock("../internal/useSmartEdgeDebug", () => ({
  useSmartEdgeDebug: () => ({
    enabled: true,
    setGraphBox: vi.fn(),
    setAvoidAreas: vi.fn(),
  }),
}));

vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  const nodeLookup = new Map<string, { selected?: boolean }>([
    ["a", { selected: true }],
    ["b", { selected: false }],
  ]);
  return {
    ...actual,
    useReactFlow: () => ({ setEdges }),
    useStore: (
      selector: (store: { nodeLookup: typeof nodeLookup }) => unknown,
    ) => selector({ nodeLookup }),
  };
});

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

const baseEdgeProps = {
  id: "e1",
  source: "a",
  target: "b",
  sourceX: 100,
  sourceY: 25,
  targetX: 300,
  targetY: 25,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  selected: false,
};

const renderEdge = (
  options: Parameters<typeof SmartEdge>[0]["options"],
  extra: Record<string, unknown> = {},
) =>
  render(
    <ReactFlowProvider>
      <SmartEdge
        nodes={nodes}
        options={options}
        {...baseEdgeProps}
        {...extra}
      />
    </ReactFlowProvider>,
  );

describe("SmartEdge", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setEdges.mockReset();
  });

  it("renders the fallback edge when routing fails", () => {
    vi.spyOn(getSmartEdgeModule, "getSmartEdge").mockReturnValue(
      new Error("routing failed"),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { container } = renderEdge({});

    expect(container.querySelector("path")).toBeTruthy();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("uses floating connection parameters when enabled", () => {
    const spy = vi.spyOn(getSmartEdgeModule, "getSmartEdge");

    renderEdge({ floating: true });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        sourcePosition: expect.any(String),
        targetPosition: expect.any(String),
      }),
    );
  });

  it("routes editable edges through waypoint stitching", () => {
    const spy = vi.spyOn(getSmartEdgeWaypointsModule, "getSmartEdgeWaypoints");

    renderEdge(
      { editable: true },
      {
        selected: true,
        data: {
          points: [{ id: "wp-1", x: 180, y: 80, active: true }],
        },
      },
    );

    expect(spy).toHaveBeenCalled();
  });

  it("ignores malformed control point data", () => {
    const spy = vi.spyOn(getSmartEdgeWaypointsModule, "getSmartEdgeWaypoints");

    renderEdge(
      { editable: true },
      {
        data: { points: [{ invalid: true }] },
      },
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ waypoints: [] }),
    );
  });

  it("shows control points when an endpoint node is selected", () => {
    vi.spyOn(getSmartEdgeWaypointsModule, "getSmartEdgeWaypoints").mockReturnValue({
      svgPathString: "M0,0 L100,0",
      edgeCenterX: 50,
      edgeCenterY: 0,
      points: [],
    });

    const { container } = renderEdge(
      { editable: true },
      {
        data: { points: [{ id: "wp-1", x: 180, y: 80, active: true }] },
      },
    );

    expect(
      container.querySelectorAll("[data-testid='smart-edge-control-point']")
        .length,
    ).toBeGreaterThan(0);
  });

  it("handles degenerate polylines when building inactive control points", () => {
    vi.spyOn(getSmartEdgeWaypointsModule, "getSmartEdgeWaypoints").mockReturnValue({
      svgPathString: "M0,0 L100,0",
      edgeCenterX: 50,
      edgeCenterY: 0,
      points: [[100, 25]],
    });

    const { container } = renderEdge(
      { editable: true },
      {
        selected: true,
        data: { points: [{ id: "wp-1", x: 100, y: 25, active: true }] },
      },
    );

    expect(
      container.querySelectorAll("[data-testid='smart-edge-control-point']").length,
    ).toBeGreaterThan(0);
  });
});
