import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SmartEdgeBatchRoutingProvider } from "./SmartEdgeBatchRoutingProvider";
import { useSmartEdgeRoute } from "./useSmartEdgeRoute";
import type { SmartEdgeBatchOptions } from "./SmartEdgeBatchRoutingProvider";
import type { RoutingRequest, RoutingResponse } from "./workerMessages";
import type { GetSmartEdgeReturn } from "../getSmartEdge";
import type { Edge, Node } from "@xyflow/react";

// Fake worker infrastructure, hoisted so the module mock factory can reference it.
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

vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  const nodeLookup = new Map<string, unknown>([
    ["a", { position: { x: 0, y: 0 }, measured: { width: 100, height: 50 } }],
    ["b", { position: { x: 300, y: 0 }, measured: { width: 100, height: 50 } }],
  ]);
  return {
    ...actual,
    useStore: (
      selector: (state: { nodeLookup: typeof nodeLookup }) => unknown,
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
  // No `measured` on purpose, to exercise the optional-chaining signature path.
  { id: "b", position: { x: 300, y: 0 }, data: {} },
];

// Edges crafted to exercise every override-reading branch in the provider.
const edges: Edge[] = [
  { id: "e-default", source: "a", target: "b" },
  {
    id: "e-override",
    source: "a",
    target: "b",
    data: {
      smartEdge: {
        preset: "step",
        options: {
          gridRatio: 20,
          nodePadding: 5,
          borderRadius: 8,
          // A valid rect plus malformed ones that fail the isRect guard at
          // each field, exercising every branch of the validation.
          avoidAreas: [
            { x: 150, y: 0, width: 20, height: 60 },
            "not-a-record",
            { bad: true },
            { x: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 1, width: 1 },
          ],
        },
      },
    },
  },
  {
    id: "e-badpreset",
    source: "a",
    target: "b",
    data: { smartEdge: { preset: "nope" } },
  },
  {
    id: "e-badoptions",
    source: "a",
    target: "b",
    data: { smartEdge: { options: "x" } },
  },
  {
    id: "e-badnumber",
    source: "a",
    target: "b",
    data: { smartEdge: { options: { gridRatio: "x", avoidAreas: "y" } } },
  },
  { id: "e-nosmartedge", source: "a", target: "b", data: { foo: 1 } },
  { id: "e-missing", source: "missing", target: "b" },
];

const options: SmartEdgeBatchOptions = {
  preset: "bezier",
  gridRatio: 10,
  nodePadding: 10,
  borderRadius: 5,
  avoidAreas: [{ x: 0, y: 0, width: 5, height: 5 }],
};

const DEFAULT_EDGE_ID = "e-default";

const routedResult: GetSmartEdgeReturn = {
  svgPathString: "M9,9",
  edgeCenterX: 1,
  edgeCenterY: 2,
  points: [],
};

function RouteProbe({ id }: Readonly<{ id: string }>) {
  const routed = useSmartEdgeRoute(id);
  return <div data-testid={`route-${id}`}>{routed ? "routed" : "pending"}</div>;
}

const probeStatus = (edgeId: string) =>
  screen.getByTestId(`route-${edgeId}`).textContent;

const renderProvider = (providerOptions?: SmartEdgeBatchOptions) =>
  render(
    <SmartEdgeBatchRoutingProvider
      nodes={nodes}
      edges={edges}
      options={providerOptions}
    >
      {edges.map((edge) => (
        <RouteProbe key={edge.id} id={edge.id} />
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

  it("routes on the main thread when Web Workers are unavailable", async () => {
    vi.stubGlobal("Worker", undefined);

    renderProvider(options);

    await waitFor(() => {
      expect(probeStatus(DEFAULT_EDGE_ID)).toBe("routed");
    });
    expect(probeStatus("e-override")).toBe("routed");
    expect(probeStatus("e-badpreset")).toBe("routed");
    // The edge whose source node is missing from the lookup is skipped.
    expect(probeStatus("e-missing")).toBe("pending");
  });

  it("uses the default preset when no options are provided", async () => {
    vi.stubGlobal("Worker", undefined);

    renderProvider();

    await waitFor(() => {
      expect(probeStatus(DEFAULT_EDGE_ID)).toBe("routed");
    });
  });

  it("routes via the worker and ignores stale responses", () => {
    vi.stubGlobal("Worker", workerMock.FakeWorker);

    const { unmount } = renderProvider(options);

    expect(workerMock.instances).toHaveLength(1);
    const instance = workerMock.instances[0];
    expect(probeStatus(DEFAULT_EDGE_ID)).toBe("pending");

    const request = instance.posted[0];

    // A stale requestId must be ignored.
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

    unmount();
    expect(instance.terminated).toBe(true);
  });

  it("falls back to the main thread when the worker errors", () => {
    vi.stubGlobal("Worker", workerMock.FakeWorker);

    renderProvider(options);

    const instance = workerMock.instances[0];
    expect(probeStatus(DEFAULT_EDGE_ID)).toBe("pending");

    act(() => {
      instance.onerror?.();
    });

    expect(probeStatus(DEFAULT_EDGE_ID)).toBe("routed");
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
