import { Position, ReactFlowProvider } from "@xyflow/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, beforeAll } from "vitest";
import { SvgWrapper } from "../../vitest/svgWrapper";
import { SmartEdge } from "./index";
import type { Node, Edge } from "@xyflow/react";

type SetEdges = (payload: Edge[] | ((edges: Edge[]) => Edge[])) => void;

let getSmartEdgeModule: typeof import("../getSmartEdge");
let getSmartEdgeWaypointsModule: typeof import("../getSmartEdge/getSmartEdgeWaypoints");

const MOCK_WAYPOINTS_PATH = "M0,0 L100,0";
const CONTROL_POINT_TEST_ID = "smart-edge-control-point";
const CONTROL_POINT_SELECTOR = `[data-testid='${CONTROL_POINT_TEST_ID}']`;

const mockWaypointsResponse = {
  svgPathString: MOCK_WAYPOINTS_PATH,
  edgeCenterX: 50,
  edgeCenterY: 0,
  points: [] satisfies number[][],
};

const setEdges = vi.fn<SetEdges>();

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
      <SvgWrapper>
        <SmartEdge
          nodes={nodes}
          options={options}
          {...baseEdgeProps}
          {...extra}
        />
      </SvgWrapper>
    </ReactFlowProvider>,
  );

describe("SmartEdge", () => {
  beforeAll(async () => {
    getSmartEdgeModule = await import("../getSmartEdge");
    getSmartEdgeWaypointsModule =
      await import("../getSmartEdge/getSmartEdgeWaypoints");
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    setEdges.mockReset();
  });

  it("renders the fallback edge when routing fails", () => {
    vi.spyOn(getSmartEdgeModule, "getSmartEdge").mockReturnValue(
      new Error("routing failed"),
    );

    const { container } = renderEdge({});

    expect(container.querySelector("path")).toBeTruthy();
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
        data: { points: [{ invalid: true }, "not-an-object"] },
      },
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ waypoints: [] }),
    );
  });

  it("routes checkpoint edges through waypoint stitching", () => {
    const spy = vi.spyOn(getSmartEdgeWaypointsModule, "getSmartEdgeWaypoints");

    renderEdge(
      { checkpoints: true },
      {
        data: {
          checkpoints: [{ x: 180, y: 80 }],
        },
      },
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        waypoints: [{ x: 180, y: 80 }],
      }),
    );
  });

  it("ignores malformed checkpoint data", () => {
    const spy = vi.spyOn(getSmartEdgeWaypointsModule, "getSmartEdgeWaypoints");

    renderEdge(
      { checkpoints: true },
      {
        data: { checkpoints: [{ invalid: true }] },
      },
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ waypoints: [] }),
    );
  });

  it("reads empty checkpoints when data is absent or malformed", () => {
    const spy = vi.spyOn(getSmartEdgeWaypointsModule, "getSmartEdgeWaypoints");

    renderEdge({ checkpoints: true });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ waypoints: [] }),
    );

    spy.mockClear();

    renderEdge(
      { checkpoints: true },
      { data: { checkpoints: "not-an-array" } },
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ waypoints: [] }),
    );
  });

  it("prefers editable waypoints when both editable and checkpoints are enabled", () => {
    const spy = vi.spyOn(getSmartEdgeWaypointsModule, "getSmartEdgeWaypoints");

    renderEdge(
      { editable: true, checkpoints: true },
      {
        data: {
          points: [{ id: "wp-1", x: 180, y: 80, active: true }],
          checkpoints: [{ x: 999, y: 999 }],
        },
      },
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        waypoints: [{ x: 180, y: 80 }],
      }),
    );
  });

  it("uses getSmartEdge when checkpoints are disabled", () => {
    const waypointsSpy = vi.spyOn(
      getSmartEdgeWaypointsModule,
      "getSmartEdgeWaypoints",
    );
    const smartEdgeSpy = vi.spyOn(getSmartEdgeModule, "getSmartEdge");

    renderEdge(
      { checkpoints: false },
      {
        data: {
          checkpoints: [{ x: 180, y: 80 }],
        },
      },
    );

    expect(smartEdgeSpy).toHaveBeenCalled();
    expect(waypointsSpy).not.toHaveBeenCalled();
  });

  it("shows control points when an endpoint node is selected", () => {
    vi.spyOn(
      getSmartEdgeWaypointsModule,
      "getSmartEdgeWaypoints",
    ).mockReturnValue(mockWaypointsResponse);

    const { container } = renderEdge(
      { editable: true },
      {
        data: { points: [{ id: "wp-1", x: 180, y: 80, active: true }] },
      },
    );

    expect(
      container.querySelectorAll(CONTROL_POINT_SELECTOR).length,
    ).toBeGreaterThan(0);
  });

  it("handles degenerate polylines when building inactive control points", () => {
    vi.spyOn(
      getSmartEdgeWaypointsModule,
      "getSmartEdgeWaypoints",
    ).mockReturnValue({
      ...mockWaypointsResponse,
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
      container.querySelectorAll(CONTROL_POINT_SELECTOR).length,
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
        <SvgWrapper>
          <SmartEdge
            nodes={unmeasuredNodes}
            options={{ floating: true }}
            {...baseEdgeProps}
          />
        </SvgWrapper>
      </ReactFlowProvider>,
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ sourceX: 100, targetX: 300 }),
    );
  });

  it("uses the default control point color and empty interior routing", () => {
    vi.spyOn(
      getSmartEdgeWaypointsModule,
      "getSmartEdgeWaypoints",
    ).mockReturnValue(mockWaypointsResponse);

    const { container } = renderEdge(
      { editable: true },
      {
        selected: true,
        data: { points: [] },
      },
    );

    expect(
      container.querySelectorAll(CONTROL_POINT_SELECTOR).length,
    ).toBeGreaterThan(0);
  });

  it("handles long routed interiors when placing inactive control points", () => {
    const interior: number[][] = Array.from(
      { length: 40 },
      (_unused, index) => [index * 2.5, Math.sin(index * 0.3) * 0.0001],
    );

    vi.spyOn(
      getSmartEdgeWaypointsModule,
      "getSmartEdgeWaypoints",
    ).mockReturnValue({
      ...mockWaypointsResponse,
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
      container.querySelectorAll(CONTROL_POINT_SELECTOR).length,
    ).toBeGreaterThan(0);
  });

  it("updates only the matching edge when persisting control points", async () => {
    const user = userEvent.setup();
    vi.spyOn(
      getSmartEdgeWaypointsModule,
      "getSmartEdgeWaypoints",
    ).mockReturnValue(mockWaypointsResponse);

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

    await user.click(screen.getByTestId(CONTROL_POINT_TEST_ID));

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
