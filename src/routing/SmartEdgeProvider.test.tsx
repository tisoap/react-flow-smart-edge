import { Position } from "@xyflow/react";
import { act, render, screen } from "@testing-library/react";
import { StrictMode, useContext, useEffect } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SmartEdgeProvider } from "./SmartEdgeProvider";
import { SmartEdgeRoutingContext } from "./routingContext";
import type { SmartEdgeContextValue } from "./routingContext";
import type { RegisteredSmartEdge, SmartEdgeMetrics } from "./scheduler";
import type {
  SmartEdgeBatchRequest,
  SmartEdgeBatchResponse,
} from "./routeBatch";
import type { Node } from "@xyflow/react";

// Fake worker infrastructure, hoisted so the module mock factory can use it.
const workerMock = vi.hoisted(() => {
  const instances: FakeWorker[] = [];
  const state = { shouldThrow: false };

  class FakeWorker {
    onmessage: ((event: { data: SmartEdgeBatchResponse }) => void) | null =
      null;
    onerror: (() => void) | null = null;
    posted: SmartEdgeBatchRequest[] = [];
    terminated = false;

    constructor() {
      if (state.shouldThrow) throw new Error("worker unavailable");
      instances.push(this);
    }

    postMessage(request: SmartEdgeBatchRequest) {
      this.posted.push(request);
    }

    terminate() {
      this.terminated = true;
    }
  }

  return { FakeWorker, instances, state };
});

vi.mock("./routing.worker?worker&inline", () => ({
  default: workerMock.FakeWorker,
}));

const nodes: Node[] = [
  {
    id: "a",
    position: { x: 0, y: 0 },
    measured: { width: 50, height: 50 },
    data: {},
  },
  {
    id: "b",
    position: { x: 300, y: 0 },
    measured: { width: 50, height: 50 },
    data: {},
  },
  {
    id: "wall",
    position: { x: 150, y: 0 },
    measured: { width: 50, height: 50 },
    data: {},
  },
];

/** Two nodes with nothing between them, so `routeOnlyWhenBlocked: true`
 * yields `kind: "clear"` for the edge that joins them. */
const clearPair: Node[] = [
  {
    id: "a",
    position: { x: 0, y: 0 },
    measured: { width: 50, height: 50 },
    data: {},
  },
  {
    id: "b",
    position: { x: 300, y: 0 },
    measured: { width: 50, height: 50 },
    data: {},
  },
];

const edgeA: Omit<RegisteredSmartEdge, "order"> = {
  id: "e1",
  source: "a",
  target: "b",
  sourceX: 50,
  sourceY: 25,
  targetX: 300,
  targetY: 25,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  preset: "bezier",
};

const edgeB: Omit<RegisteredSmartEdge, "order"> = { ...edgeA, id: "e2" };

/** Registers `edge` through context on mount, unregisters on unmount. Reports
 * the resolved context back to the test via `onContext`, called on every
 * render so the test always has the latest snapshot. */
function EdgeRegistrar({
  edge,
  onContext,
}: Readonly<{
  edge: Omit<RegisteredSmartEdge, "order">;
  onContext?: (context: SmartEdgeContextValue | null) => void;
}>) {
  const context = useContext(SmartEdgeRoutingContext);
  onContext?.(context);

  useEffect(() => context?.registerEdge(edge), [context, edge]);

  return null;
}

/** Reports the resolved context back to the test via `onContext`, without
 * registering any edge of its own — for tests that drive `registerEdge`
 * manually to control exact call order. */
function ContextCapture({
  onContext,
}: Readonly<{
  onContext: (context: SmartEdgeContextValue | null) => void;
}>) {
  const context = useContext(SmartEdgeRoutingContext);
  onContext(context);

  return null;
}

const flushDebounce = async (): Promise<void> => {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
};

/** A mutable box for the context captured by `EdgeRegistrar`'s `onContext`.
 * Using a plain `let` here instead would have TypeScript narrow it to the
 * literal `null` of its initializer (since the only reassignment is inside a
 * closure), turning a later `.store` read into a "Property does not exist on
 * type never" error — a container object sidesteps that narrowing. */
const createContextBox = (): { current: SmartEdgeContextValue | null } => ({
  current: null,
});

describe("SmartEdgeProvider", () => {
  beforeEach(() => {
    workerMock.instances.length = 0;
    workerMock.state.shouldThrow = false;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders its children", () => {
    vi.stubGlobal("Worker", undefined);

    render(
      <SmartEdgeProvider nodes={nodes}>
        <div data-testid="child">hi</div>
      </SmartEdgeProvider>,
    );

    expect(screen.getByTestId("child").textContent).toBe("hi");
  });

  it("routes a registered edge on the main thread and reports onMetrics", async () => {
    vi.stubGlobal("Worker", undefined);
    const onMetrics = vi.fn<(metrics: SmartEdgeMetrics) => void>();
    const contextBox = createContextBox();

    render(
      <SmartEdgeProvider nodes={nodes} onMetrics={onMetrics}>
        <EdgeRegistrar
          edge={edgeA}
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();

    expect(contextBox.current?.store.getRoute("e1")).toMatchObject({
      kind: "routed",
      wasRouted: true,
    });
    expect(onMetrics).toHaveBeenCalled();
    const lastCall = onMetrics.mock.calls.at(-1);
    expect(lastCall?.[0].executedOn).toBe("main");
  });

  it("routes via the worker and reports executedOn worker", async () => {
    vi.stubGlobal("Worker", workerMock.FakeWorker);
    const contextBox = createContextBox();

    render(
      <SmartEdgeProvider nodes={nodes}>
        <EdgeRegistrar
          edge={edgeA}
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
      </SmartEdgeProvider>,
    );

    expect(workerMock.instances).toHaveLength(1);
    const instance = workerMock.instances[0];

    await flushDebounce();
    expect(instance.posted).toHaveLength(1);
    const { requestId } = instance.posted[0];

    await act(async () => {
      instance.onmessage?.({
        data: {
          requestId,
          results: {
            e1: {
              kind: "routed",
              wasRouted: true,
              svgPathString: "M0,0",
              edgeCenterX: 0,
              edgeCenterY: 0,
              points: [],
            },
          },
          durationMs: 3,
        },
      });
      await Promise.resolve();
    });

    expect(contextBox.current?.store.getRoute("e1")).toMatchObject({
      kind: "routed",
      svgPathString: "M0,0",
    });
  });

  it("falls back to the main thread when the worker errors mid-flight", async () => {
    vi.stubGlobal("Worker", workerMock.FakeWorker);
    const contextBox = createContextBox();

    render(
      <SmartEdgeProvider nodes={nodes}>
        <EdgeRegistrar
          edge={edgeA}
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
      </SmartEdgeProvider>,
    );

    expect(workerMock.instances).toHaveLength(1);
    const instance = workerMock.instances[0];
    await flushDebounce();

    await act(async () => {
      instance.onerror?.();
      await Promise.resolve();
    });

    expect(instance.terminated).toBe(true);

    // The same provider's worker is now broken; a fresh registration on the
    // same context should route on the main thread instead.
    act(() => {
      contextBox.current?.registerEdge(edgeB);
    });
    await flushDebounce();

    expect(contextBox.current?.store.getRoute("e2")).toMatchObject({
      kind: "routed",
    });
  });

  it("falls back to the main thread when worker construction throws", async () => {
    workerMock.state.shouldThrow = true;
    vi.stubGlobal("Worker", workerMock.FakeWorker);
    const contextBox = createContextBox();

    render(
      <SmartEdgeProvider nodes={nodes}>
        <EdgeRegistrar
          edge={edgeA}
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();

    expect(workerMock.instances).toHaveLength(0);
    expect(contextBox.current?.store.getRoute("e1")).toMatchObject({
      kind: "routed",
    });
  });

  it("unmounts cleanly, terminating the worker and leaving no pending timers", () => {
    vi.stubGlobal("Worker", workerMock.FakeWorker);

    const { unmount } = render(
      <SmartEdgeProvider nodes={nodes}>
        <EdgeRegistrar edge={edgeA} />
      </SmartEdgeProvider>,
    );

    expect(workerMock.instances).toHaveLength(1);
    const instance = workerMock.instances[0];

    unmount();

    expect(instance.terminated).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not crash when double-mounted under StrictMode", async () => {
    vi.stubGlobal("Worker", undefined);
    const contextBox = createContextBox();

    render(
      <StrictMode>
        <SmartEdgeProvider nodes={nodes}>
          <EdgeRegistrar
            edge={edgeA}
            onContext={(context) => {
              contextBox.current = context;
            }}
          />
        </SmartEdgeProvider>
      </StrictMode>,
    );

    await flushDebounce();

    expect(contextBox.current?.store.getRoute("e1")).toMatchObject({
      kind: "routed",
    });
  });

  it("exposes registrations in registration order and the latest absolute nodes snapshot", () => {
    vi.stubGlobal("Worker", undefined);
    const contextBox = createContextBox();

    render(
      <SmartEdgeProvider nodes={nodes}>
        <EdgeRegistrar
          edge={edgeA}
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
        <EdgeRegistrar edge={edgeB} />
      </SmartEdgeProvider>,
    );

    expect(
      contextBox.current?.getRegistrationsInOrder().map((edge) => edge.id),
    ).toEqual(["e1", "e2"]);
    expect(contextBox.current?.getNodesSnapshot()).toEqual(nodes);
  });

  it("keeps an edge's paint order stable across unregister and re-register under the same id", () => {
    vi.stubGlobal("Worker", undefined);
    const contextBox = createContextBox();

    render(
      <SmartEdgeProvider nodes={nodes}>
        <ContextCapture
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
      </SmartEdgeProvider>,
    );
    const context = contextBox.current;
    if (!context) throw new Error("expected a context value");

    const unregisterA = context.registerEdge(edgeA);
    context.registerEdge(edgeB);
    expect(context.getRegistrationsInOrder().map((edge) => edge.id)).toEqual([
      "e1",
      "e2",
    ]);

    // Unregister and re-register e1 under the same id, with different
    // endpoints. It should keep its original (first) position rather than
    // jumping after e2, which would flip Task 15's hop layering.
    unregisterA();
    context.registerEdge({ ...edgeA, sourceX: 999 });

    expect(context.getRegistrationsInOrder().map((edge) => edge.id)).toEqual([
      "e1",
      "e2",
    ]);
  });

  it("applies a live options update without remounting", async () => {
    vi.stubGlobal("Worker", undefined);
    const onMetrics = vi.fn<(metrics: SmartEdgeMetrics) => void>();
    const contextBox = createContextBox();

    const { rerender } = render(
      <SmartEdgeProvider
        nodes={clearPair}
        options={{ routeOnlyWhenBlocked: true }}
        onMetrics={onMetrics}
      >
        <EdgeRegistrar
          edge={edgeA}
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();
    expect(contextBox.current?.store.getRoute("e1")).toEqual({
      kind: "clear",
      wasRouted: false,
    });
    const metricsAfterClear = onMetrics.mock.calls.length;

    rerender(
      <SmartEdgeProvider
        nodes={clearPair}
        options={{ routeOnlyWhenBlocked: false }}
        onMetrics={onMetrics}
      >
        <EdgeRegistrar
          edge={edgeA}
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();

    expect(contextBox.current?.store.getRoute("e1")).toMatchObject({
      kind: "routed",
      wasRouted: true,
    });
    expect(onMetrics.mock.calls.length).toBeGreaterThan(metricsAfterClear);
  });

  it("does not extra-invalidate when options values are unchanged", async () => {
    vi.stubGlobal("Worker", undefined);
    const onMetrics = vi.fn<(metrics: SmartEdgeMetrics) => void>();
    const contextBox = createContextBox();

    const { rerender } = render(
      <SmartEdgeProvider
        nodes={clearPair}
        options={{ gridRatio: 10 }}
        onMetrics={onMetrics}
      >
        <EdgeRegistrar
          edge={edgeA}
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();
    const callsAfterFirst = onMetrics.mock.calls.length;

    rerender(
      <SmartEdgeProvider
        nodes={clearPair}
        options={{ gridRatio: 10 }}
        onMetrics={onMetrics}
      >
        <EdgeRegistrar
          edge={edgeA}
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();

    expect(onMetrics.mock.calls).toHaveLength(callsAfterFirst);
    expect(contextBox.current?.options.gridRatio).toBe(10);
  });

  it("updates dragFallbackStyle on context without remounting", async () => {
    vi.stubGlobal("Worker", undefined);
    const contextBox = createContextBox();

    const { rerender } = render(
      <SmartEdgeProvider nodes={clearPair}>
        <EdgeRegistrar
          edge={edgeA}
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();
    expect(contextBox.current?.options.dragFallbackStyle).toEqual({
      strokeDasharray: "5 5",
    });

    rerender(
      <SmartEdgeProvider
        nodes={clearPair}
        options={{ dragFallbackStyle: { opacity: 0.4 } }}
      >
        <EdgeRegistrar
          edge={edgeA}
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
      </SmartEdgeProvider>,
    );

    expect(contextBox.current?.options.dragFallbackStyle).toEqual({
      opacity: 0.4,
    });
  });
});
