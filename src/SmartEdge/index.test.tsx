import { Position, ReactFlowProvider } from "@xyflow/react";
import { act, render } from "@testing-library/react";
import { useContext } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SvgWrapper } from "../../vitest/svgWrapper";
import { SmartEdge } from "./index";
import { __resetNoProviderWarning } from "./noProviderWarning";
import { SmartEdgeProvider } from "../routing/SmartEdgeProvider";
import { SmartEdgeRoutingContext } from "../routing/routingContext";
import type { SmartEdgeOptions } from "./index";
import type { SmartEdgeContextValue } from "../routing/routingContext";
import type { SmartEdgeProviderOptions } from "../routing/routingContext";
import type { Node } from "@xyflow/react";

const CONTROL_POINT_SELECTOR = "[data-testid='smart-edge-control-point']";

const nodes: Node[] = [
  {
    id: "aaa",
    position: { x: 0, y: 0 },
    measured: { width: 50, height: 50 },
    data: {},
  },
  {
    id: "bbb",
    position: { x: 300, y: 0 },
    measured: { width: 50, height: 50 },
    data: {},
  },
];

const withFlag = (nodeId: string, flag: "dragging" | "selected"): Node[] =>
  nodes.map((node) => (node.id === nodeId ? { ...node, [flag]: true } : node));

const baseEdgeProps = {
  id: "e1",
  source: "aaa",
  target: "bbb",
  sourceX: 50,
  sourceY: 25,
  targetX: 300,
  targetY: 25,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

const createContextBox = (): { current: SmartEdgeContextValue | null } => ({
  current: null,
});

function ContextCapture({
  onContext,
}: Readonly<{
  onContext: (context: SmartEdgeContextValue | null) => void;
}>) {
  onContext(useContext(SmartEdgeRoutingContext));
  return null;
}

const flushDebounce = async (): Promise<void> => {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
};

interface RenderOptions {
  providerNodes?: Node[];
  providerOptions?: SmartEdgeProviderOptions;
  options?: SmartEdgeOptions;
  preset?: "bezier" | "step";
  extra?: Record<string, unknown>;
}

const renderEdge = ({
  providerNodes = nodes,
  providerOptions,
  options = {},
  preset = "bezier",
  extra = {},
}: RenderOptions = {}) => {
  const contextBox = createContextBox();
  const view = render(
    <ReactFlowProvider>
      <SmartEdgeProvider nodes={providerNodes} options={providerOptions}>
        <ContextCapture
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
        <SvgWrapper>
          <SmartEdge
            preset={preset}
            options={options}
            {...baseEdgeProps}
            {...extra}
          />
        </SvgWrapper>
      </SmartEdgeProvider>
    </ReactFlowProvider>,
  );
  return { ...view, contextBox };
};

describe("SmartEdge render decision", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", undefined);
    __resetNoProviderWarning();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    __resetNoProviderWarning();
  });

  it("renders the fallback and warns once when there is no provider", () => {
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    const { container } = render(
      <ReactFlowProvider>
        <SvgWrapper>
          <SmartEdge preset="bezier" options={{}} {...baseEdgeProps} />
          <SmartEdge preset="bezier" options={{}} {...baseEdgeProps} id="e2" />
        </SvgWrapper>
      </ReactFlowProvider>,
    );

    expect(container.querySelector("path")).toBeTruthy();
    expect(warnSpy).toHaveBeenCalledTimes(1);

    __resetNoProviderWarning();
    render(
      <ReactFlowProvider>
        <SvgWrapper>
          <SmartEdge preset="bezier" options={{}} {...baseEdgeProps} id="e3" />
        </SvgWrapper>
      </ReactFlowProvider>,
    );

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("renders the fallback while the route is pending", () => {
    const { container, contextBox } = renderEdge({
      providerOptions: { routeOnlyWhenBlocked: false },
    });

    expect(contextBox.current?.store.getRoute("e1")).toBeUndefined();
    expect(container.querySelector("path")).toBeTruthy();
  });

  it("renders the routed path once the provider publishes a route", async () => {
    const { container, contextBox } = renderEdge({
      providerOptions: { routeOnlyWhenBlocked: false },
    });

    await flushDebounce();

    const route = contextBox.current?.store.getRoute("e1");
    expect(route).toMatchObject({ kind: "routed", wasRouted: true });
    const path = container.querySelector<SVGPathElement>("path");
    expect(route?.kind === "routed" ? route.svgPathString : "").toBe(
      path?.getAttribute("d"),
    );
  });

  it("renders the fallback when the corridor is clear", async () => {
    const { container, contextBox } = renderEdge();

    await flushDebounce();

    expect(contextBox.current?.store.getRoute("e1")).toMatchObject({
      kind: "clear",
      wasRouted: false,
    });
    expect(container.querySelector("path")).toBeTruthy();
  });

  it("renders a dashed fallback while an endpoint drags and routeWhileDragging is off", async () => {
    const { container } = renderEdge({
      providerNodes: withFlag("aaa", "dragging"),
      providerOptions: { routeOnlyWhenBlocked: false },
    });

    await flushDebounce();

    const path = container.querySelector<SVGPathElement>("path");
    expect(path?.style.strokeDasharray).toBe("5 5");
  });

  it("keeps routing while dragging when routeWhileDragging is on", async () => {
    const { contextBox } = renderEdge({
      providerNodes: withFlag("aaa", "dragging"),
      providerOptions: {
        routeOnlyWhenBlocked: false,
        routeWhileDragging: true,
      },
    });

    await flushDebounce();

    expect(contextBox.current?.store.getRoute("e1")).toMatchObject({
      kind: "routed",
    });
  });

  it("forwards the preset to the registration", () => {
    const { contextBox } = renderEdge({ preset: "step" });

    const registrations = contextBox.current?.getRegistrationsInOrder() ?? [];
    expect(registrations[0]?.preset).toBe("step");
  });
});

describe("SmartEdge editable behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const editableExtra = {
    selected: true,
    data: { points: [{ id: "wp-1", x: 180, y: 80, active: true }] },
  };

  it("registers waypoints and reveals control points when selected", async () => {
    const { container, contextBox } = renderEdge({
      providerOptions: { routeOnlyWhenBlocked: false },
      options: { editable: true },
      extra: editableExtra,
    });

    await flushDebounce();

    const registrations = contextBox.current?.getRegistrationsInOrder() ?? [];
    expect(registrations[0]?.waypoints).toEqual([{ x: 180, y: 80 }]);
    expect(
      container.querySelectorAll(CONTROL_POINT_SELECTOR).length,
    ).toBeGreaterThan(0);
  });

  it("reveals control points when an endpoint node is selected", async () => {
    const { container } = renderEdge({
      providerNodes: withFlag("aaa", "selected"),
      providerOptions: { routeOnlyWhenBlocked: false },
      options: { editable: true },
      extra: {
        selected: false,
        data: { points: [{ id: "wp-1", x: 180, y: 80, active: true }] },
      },
    });

    await flushDebounce();

    expect(
      container.querySelectorAll(CONTROL_POINT_SELECTOR).length,
    ).toBeGreaterThan(0);
  });

  it("hides control points when neither the edge nor its nodes are selected", async () => {
    const { container } = renderEdge({
      providerOptions: { routeOnlyWhenBlocked: false },
      options: { editable: true },
      extra: {
        selected: false,
        data: { points: [{ id: "wp-1", x: 180, y: 80, active: true }] },
      },
    });

    await flushDebounce();

    expect(container.querySelectorAll(CONTROL_POINT_SELECTOR)).toHaveLength(0);
  });

  it("applies a custom control point color", async () => {
    const { container } = renderEdge({
      providerOptions: { routeOnlyWhenBlocked: false },
      options: { editable: true, controlPointColor: "#ff0000" },
      extra: editableExtra,
    });

    await flushDebounce();

    const point = container.querySelector<SVGCircleElement>(
      CONTROL_POINT_SELECTOR,
    );
    expect(point?.getAttribute("stroke")).toBe("#ff0000");
  });

  it("routes floating edges through the provider node snapshot", async () => {
    const { contextBox } = renderEdge({
      providerOptions: { routeOnlyWhenBlocked: false },
      options: { floating: true },
      extra: { source: "aaa", target: "bbb" },
    });

    await flushDebounce();

    expect(contextBox.current?.store.getRoute("e1")).toMatchObject({
      kind: "routed",
    });
  });
});
