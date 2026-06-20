import { Position, ReactFlowProvider } from "@xyflow/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import * as getSmartEdgeModule from "../getSmartEdge";
import * as getSmartEdgeWaypointsModule from "../getSmartEdge/getSmartEdgeWaypoints";
import { SmartEdge } from "./index";
import type { Node, Edge } from "@xyflow/react";

type SetEdges = (payload: Edge[] | ((edges: Edge[]) => Edge[])) => void;

const setEdges = vi.fn<SetEdges>();
let debugEnabled = true;

vi.mock("../internal/useSmartEdgeDebug", () => ({
  useSmartEdgeDebug: () => ({
    enabled: debugEnabled,
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
    debugEnabled = true;
  });

  it("renders the fallback edge when routing fails", () => {
    vi.spyOn(getSmartEdgeModule, "getSmartEdge").mockReturnValue(
      new Error("routing failed"),
    );
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { container } = renderEdge({});

    expect(container.querySelector("path")).toBeTruthy();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("uses floating connection parameters when enabled", () => {
    const spy = vi.spyOn(getSmartEdgeModule, "getSmartEdge");

    renderEdge({ floating: true });

    expect(spy).toHaveBeenCalled();
    const callArgs = vi.mocked(spy).mock.calls[0][0];
    expect(typeof callArgs.sourcePosition).toBe("string");
    expect(typeof callArgs.targetPosition).toBe("string");
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
    vi.spyOn(
      getSmartEdgeWaypointsModule,
      "getSmartEdgeWaypoints",
    ).mockReturnValue({
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
    vi.spyOn(
      getSmartEdgeWaypointsModule,
      "getSmartEdgeWaypoints",
    ).mockReturnValue({
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
      container.querySelectorAll("[data-testid='smart-edge-control-point']")
        .length,
    ).toBeGreaterThan(0);
  });

  it("falls back to handle positions when floating nodes are not measured", () => {
    const spy = vi.spyOn(getSmartEdgeModule, "getSmartEdge");
    const unmeasuredNodes: Node[] = [
      { id: "a", position: { x: 0, y: 0 }, data: {} },
      { id: "b", position: { x: 300, y: 0 }, data: {} },
    ];

    render(
      <ReactFlowProvider>
        <SmartEdge
          nodes={unmeasuredNodes}
          options={{ floating: true }}
          {...baseEdgeProps}
        />
      </ReactFlowProvider>,
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ sourceX: 100, targetX: 300 }),
    );
  });

  it("renders the fallback edge without logging when debug is disabled", () => {
    debugEnabled = false;
    vi.spyOn(getSmartEdgeModule, "getSmartEdge").mockReturnValue(
      new Error("routing failed"),
    );
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { container } = renderEdge({});

    expect(container.querySelector("path")).toBeTruthy();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("uses the default control point color and empty interior routing", () => {
    vi.spyOn(
      getSmartEdgeWaypointsModule,
      "getSmartEdgeWaypoints",
    ).mockReturnValue({
      svgPathString: "M0,0 L100,0",
      edgeCenterX: 50,
      edgeCenterY: 0,
      points: [],
    });

    const { container } = renderEdge(
      { editable: true },
      {
        selected: true,
        data: { points: [] },
      },
    );

    expect(
      container.querySelectorAll("[data-testid='smart-edge-control-point']")
        .length,
    ).toBeGreaterThan(0);
  });

  it("handles long routed interiors when placing inactive control points", () => {
    const interior: number[][] = Array.from({ length: 40 }, (_, index) => [
      index * 2.5,
      Math.sin(index * 0.3) * 0.0001,
    ]);

    vi.spyOn(
      getSmartEdgeWaypointsModule,
      "getSmartEdgeWaypoints",
    ).mockReturnValue({
      svgPathString: "M0,0 L100,0",
      edgeCenterX: 50,
      edgeCenterY: 0,
      points: interior,
    });

    const { container } = renderEdge(
      { editable: true, controlPointColor: "#ff0000" },
      {
        selected: true,
        data: {
          points: [{ id: "wp-1", x: 50, y: 0, active: true }],
        },
      },
    );

    expect(
      container.querySelectorAll("[data-testid='smart-edge-control-point']")
        .length,
    ).toBeGreaterThan(0);
  });

  it("updates only the matching edge when persisting control points", async () => {
    const user = userEvent.setup();
    vi.spyOn(
      getSmartEdgeWaypointsModule,
      "getSmartEdgeWaypoints",
    ).mockReturnValue({
      svgPathString: "M0,0 L100,0",
      edgeCenterX: 50,
      edgeCenterY: 0,
      points: [],
    });

    setEdges.mockImplementation((payload) => {
      if (typeof payload !== "function") {
        return;
      }
      const edges: Edge[] = [
        { id: "e1", source: "a", target: "b", data: { points: [] } },
        { id: "e2", source: "a", target: "b", data: { points: [] } },
      ];
      payload(edges);
    });

    renderEdge(
      { editable: true },
      {
        selected: true,
        data: { points: [] },
      },
    );

    await user.click(screen.getByTestId("smart-edge-control-point"));

    expect(setEdges).toHaveBeenCalled();
    const updater = vi.mocked(setEdges).mock.calls.at(-1)?.[0];
    expect(typeof updater).toBe("function");
    if (typeof updater !== "function") {
      return;
    }
    const result = updater([
      { id: "e1", source: "a", target: "b", data: { points: [] } },
      {
        id: "e2",
        source: "a",
        target: "b",
        data: { points: [{ id: "other", x: 1, y: 2 }] },
      },
    ]);

    expect(result).toEqual([
      expect.objectContaining({ id: "e1", source: "a", target: "b" }),
      {
        id: "e2",
        source: "a",
        target: "b",
        data: { points: [{ id: "other", x: 1, y: 2 }] },
      },
    ]);
  });
});
