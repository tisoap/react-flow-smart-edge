import { Position } from "@xyflow/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SmartEdgeBatchRoutingProvider } from "./SmartEdgeBatchRoutingProvider";
import { useSmartEdgeRoute } from "./useSmartEdgeRoute";
import type { SmartEdgeBatchOptions } from "./routeSmartEdgesBatch";
import type { EdgeRouteInput } from "./edgeOptions";
import type { RoutingRequest, RoutingResponse } from "./workerMessages";
import type { GetSmartEdgeReturn } from "../getSmartEdge";
import type { Node } from "@xyflow/react";

// Fake worker infrastructure, hoisted so the module mock factory can use it.
const workerMock = vi.hoisted(() => {
  const instances: FakeWorker[] = [];
  const state = { shouldThrow: false };

  class FakeWorker {
    onmessage: ((event: { data: RoutingResponse }) => void) | null = null;
    onerror: (() => void) | null = null;
    posted: RoutingRequest[] = [];
    terminated = false;

    constructor() {
      if (state.shouldThrow) throw new Error("worker unavailable");
      instances.push(this);
    }

    postMessage(message: RoutingRequest) {
      this.posted.push(message);
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
    measured: { width: 100, height: 50 },
    data: {},
  },
  // No `measured` to exercise the optional-chaining node projection.
  { id: "b", position: { x: 300, y: 0 }, data: {} },
];

const DEFAULT_EDGE_ID = "e-default";

const edgeProps = (
  overrides: Partial<EdgeRouteInput> = {},
): EdgeRouteInput => ({
  id: DEFAULT_EDGE_ID,
  source: "a",
  target: "b",
  sourceX: 100,
  sourceY: 25,
  targetX: 300,
  targetY: 25,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  ...overrides,
});

const edges: EdgeRouteInput[] = [
  edgeProps(),
  edgeProps({ id: "e-step", data: { smartEdge: { preset: "step" } } }),
];

const options: SmartEdgeBatchOptions = {
  preset: "bezier",
  gridRatio: 10,
  nodePadding: 10,
};

const routedResult: GetSmartEdgeReturn = {
  svgPathString: "M9,9",
  edgeCenterX: 1,
  edgeCenterY: 2,
  points: [],
};

function RouteProbe({ edge }: Readonly<{ edge: EdgeRouteInput }>) {
  const routed = useSmartEdgeRoute(edge);
  return (
    <div data-testid={`route-${edge.id}`}>{routed ? "routed" : "pending"}</div>
  );
}

const probeStatus = (edgeId: string) =>
  screen.getByTestId(`route-${edgeId}`).textContent;

const renderProvider = (providerOptions?: SmartEdgeBatchOptions) =>
  render(
    <SmartEdgeBatchRoutingProvider nodes={nodes} options={providerOptions}>
      {edges.map((edge) => (
        <RouteProbe key={edge.id} edge={edge} />
      ))}
    </SmartEdgeBatchRoutingProvider>,
  );

describe("SmartEdgeBatchRoutingProvider", () => {
  beforeEach(() => {
    workerMock.instances.length = 0;
    workerMock.state.shouldThrow = false;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("routes registered edges on the main thread when no Worker exists", async () => {
    vi.stubGlobal("Worker", undefined);

    renderProvider(options);

    await waitFor(() => {
      expect(probeStatus(DEFAULT_EDGE_ID)).toBe("routed");
    });
    expect(probeStatus("e-step")).toBe("routed");
  });

  it("uses the default preset when no options are provided", async () => {
    vi.stubGlobal("Worker", undefined);

    renderProvider();

    await waitFor(() => {
      expect(probeStatus(DEFAULT_EDGE_ID)).toBe("routed");
    });
  });

  it("routes the batch via the worker and ignores stale responses", async () => {
    vi.stubGlobal("Worker", workerMock.FakeWorker);

    renderProvider(options);

    // Both edges coalesce into a single batch message.
    await waitFor(() => {
      expect(workerMock.instances).toHaveLength(1);
      expect(workerMock.instances[0].posted).toHaveLength(1);
    });

    const instance = workerMock.instances[0];
    const request = instance.posted[0];
    expect(
      request.edges
        .map((edge) => edge.id)
        .sort((idA, idB) => idA.localeCompare(idB)),
    ).toEqual([DEFAULT_EDGE_ID, "e-step"]);
    expect(probeStatus(DEFAULT_EDGE_ID)).toBe("pending");

    // A stale requestId is ignored.
    act(() => {
      instance.onmessage?.({
        data: {
          requestId: request.requestId + 1,
          results: { [DEFAULT_EDGE_ID]: routedResult },
        },
      });
    });
    expect(probeStatus(DEFAULT_EDGE_ID)).toBe("pending");

    // The current requestId is applied.
    act(() => {
      instance.onmessage?.({
        data: {
          requestId: request.requestId,
          results: { [DEFAULT_EDGE_ID]: routedResult },
        },
      });
    });
    expect(probeStatus(DEFAULT_EDGE_ID)).toBe("routed");
  });

  it("terminates the worker on unmount", async () => {
    vi.stubGlobal("Worker", workerMock.FakeWorker);

    const { unmount } = renderProvider(options);
    await waitFor(() => {
      expect(workerMock.instances).toHaveLength(1);
    });
    const instance = workerMock.instances[0];

    unmount();
    expect(instance.terminated).toBe(true);
  });

  it("falls back to the main thread when the worker errors", async () => {
    vi.stubGlobal("Worker", workerMock.FakeWorker);

    renderProvider(options);
    await waitFor(() => {
      expect(workerMock.instances).toHaveLength(1);
    });
    const instance = workerMock.instances[0];
    expect(probeStatus(DEFAULT_EDGE_ID)).toBe("pending");

    act(() => {
      instance.onerror?.();
    });

    await waitFor(() => {
      expect(probeStatus(DEFAULT_EDGE_ID)).toBe("routed");
    });
    expect(instance.terminated).toBe(true);
  });

  it("falls back to the main thread when worker construction throws", async () => {
    workerMock.state.shouldThrow = true;
    vi.stubGlobal("Worker", workerMock.FakeWorker);

    renderProvider(options);

    await waitFor(() => {
      expect(probeStatus(DEFAULT_EDGE_ID)).toBe("routed");
    });
    expect(workerMock.instances).toHaveLength(0);
  });
});
