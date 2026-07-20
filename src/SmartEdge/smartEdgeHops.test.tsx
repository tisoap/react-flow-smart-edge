import { Position } from "@xyflow/react";
import { act, render } from "@testing-library/react";
import { useContext } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useSmartEdgePath } from "../routing/useSmartEdgePath";
import { SmartEdgeProvider } from "../routing/SmartEdgeProvider";
import { SmartEdgeRoutingContext } from "../routing/routingContext";
import { computeHoppedPath, useHoppedPath } from "./smartEdgeHops";
import type { HopSetting } from "./smartEdgeHops";
import type { UseSmartEdgePathInput } from "../routing/useSmartEdgePath";
import type { SmartEdgeContextValue } from "../routing/routingContext";
import type { Node, XYPosition } from "@xyflow/react";

const flushDebounce = async (): Promise<void> => {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
};

/** Registers one edge with the provider (via `useSmartEdgePath`, so it gets
 * a real routed/clear route and a paint order) and reports its hopped path
 * on every render. */
function EdgeProbe({
  input,
  hops,
  editable,
  checkpoints,
  onResult,
}: Readonly<{
  input: UseSmartEdgePathInput;
  hops: HopSetting;
  editable?: boolean;
  checkpoints?: boolean;
  onResult: (hopped: string | null) => void;
}>) {
  useSmartEdgePath(input);
  const hopped = useHoppedPath({
    edgeId: input.id,
    sourceX: input.sourceX,
    sourceY: input.sourceY,
    targetX: input.targetX,
    targetY: input.targetY,
    hops,
    editable,
    checkpoints,
  });
  onResult(hopped);
  return null;
}

/** Calls `useHoppedPath` for an edge id that is never registered via
 * `useSmartEdgePath` — used to exercise the "no matching registration"
 * guard alongside a route pushed directly into the store. */
function HopOnlyProbe({
  edgeId,
  source,
  target,
  hops,
  onResult,
}: Readonly<{
  edgeId: string;
  source: XYPosition;
  target: XYPosition;
  hops: HopSetting;
  onResult: (hopped: string | null) => void;
}>) {
  const hopped = useHoppedPath({
    edgeId,
    sourceX: source.x,
    sourceY: source.y,
    targetX: target.x,
    targetY: target.y,
    hops,
  });
  onResult(hopped);
  return null;
}

/** Reports the resolved context so a test can reach into the store directly
 * (e.g. to publish a route for an edge that was never registered). */
function ContextCapture({
  onContext,
}: Readonly<{
  onContext: (context: SmartEdgeContextValue | null) => void;
}>) {
  const context = useContext(SmartEdgeRoutingContext);
  onContext(context);
  return null;
}

const verticalEdge: UseSmartEdgePathInput = {
  id: "v",
  source: "vTop",
  target: "vBottom",
  sourceX: 200,
  sourceY: 0,
  sourcePosition: Position.Bottom,
  targetX: 200,
  targetY: 400,
  targetPosition: Position.Top,
  preset: "step",
};

const horizontalEdge: UseSmartEdgePathInput = {
  id: "h",
  source: "hLeft",
  target: "hRight",
  sourceX: 0,
  sourceY: 200,
  sourcePosition: Position.Right,
  targetX: 400,
  targetY: 200,
  targetPosition: Position.Left,
  preset: "step",
};

/** An obstacle placed on the vertical edge's straight native path (x≈200,
 * y between 40 and 80) but well clear of the horizontal edge's (y=200): with
 * `routeOnlyWhenBlocked` on (the default) this forces the vertical edge to
 * real pathfinding (`kind: "routed"`) while the horizontal edge's direct
 * line stays unobstructed (`kind: "clear"`). */
const blockerNode: Node = {
  id: "blocker",
  position: { x: 190, y: 40 },
  measured: { width: 20, height: 40 },
  data: {},
};

describe("computeHoppedPath", () => {
  const ownPolyline: XYPosition[] = [
    { x: 0, y: 100 },
    { x: 200, y: 100 },
  ];
  const crossingPolyline: XYPosition[] = [
    { x: 100, y: 0 },
    { x: 100, y: 200 },
  ];

  it("draws a bridge arc where the polyline crosses an underneath one", () => {
    const path = computeHoppedPath({
      ownPolyline,
      underneathPolylines: [crossingPolyline],
      hops: true,
    });
    expect(path).toMatch(/A \d/);
  });

  it("draws no bridge when there are no underneath polylines", () => {
    const path = computeHoppedPath({
      ownPolyline,
      underneathPolylines: [],
      hops: true,
    });
    expect(path).not.toMatch(/A \d/);
  });

  it("uses default hop config for a falsy flag or an empty object", () => {
    expect(
      computeHoppedPath({
        ownPolyline,
        underneathPolylines: [crossingPolyline],
        hops: false,
      }),
    ).toMatch(/A \d/);
    expect(
      computeHoppedPath({
        ownPolyline,
        underneathPolylines: [crossingPolyline],
        hops: {},
      }),
    ).toMatch(/A \d/);
  });

  it("honors an explicit hop config", () => {
    const path = computeHoppedPath({
      ownPolyline,
      underneathPolylines: [crossingPolyline],
      hops: { radius: 8, borderRadius: 4, epsilon: 1 },
    });
    expect(path).toMatch(/A 8 8 /);
  });
});

describe("useHoppedPath", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("bridges the higher-order edge over the lower one, not the reverse", async () => {
    const topResults: (string | null)[] = [];
    const bottomResults: (string | null)[] = [];

    render(
      <SmartEdgeProvider nodes={[]} options={{ routeOnlyWhenBlocked: false }}>
        <EdgeProbe
          input={verticalEdge}
          hops={true}
          onResult={(hopped) => {
            bottomResults.push(hopped);
          }}
        />
        <EdgeProbe
          input={horizontalEdge}
          hops={true}
          onResult={(hopped) => {
            topResults.push(hopped);
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();

    expect(topResults.at(-1)).toMatch(/A \d/);
    expect(bottomResults.at(-1)).not.toBeNull();
    expect(bottomResults.at(-1)).not.toMatch(/A \d/);
  });

  it("skips an underneath edge that has no published route yet", async () => {
    const topResults: (string | null)[] = [];
    const draggingNode: Node = {
      id: "vTop",
      position: { x: 200, y: 0 },
      dragging: true,
      data: {},
    };

    render(
      <SmartEdgeProvider
        nodes={[draggingNode]}
        options={{ routeOnlyWhenBlocked: false }}
      >
        <EdgeProbe
          input={verticalEdge}
          hops={true}
          onResult={() => undefined}
        />
        <EdgeProbe
          input={horizontalEdge}
          hops={true}
          onResult={(hopped) => {
            topResults.push(hopped);
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();

    // The vertical edge is deferred (its "vTop" endpoint is dragging and
    // `routeWhileDragging` defaults to off), so it never publishes a route;
    // the horizontal edge on top still gets its own plain routed path.
    expect(topResults.at(-1)).not.toBeNull();
    expect(topResults.at(-1)).not.toMatch(/A \d/);
  });

  it("still bridges over a clear (unrouted) underneath edge via its native polyline", async () => {
    const topResults: (string | null)[] = [];

    render(
      <SmartEdgeProvider nodes={[blockerNode]}>
        <EdgeProbe
          input={horizontalEdge}
          hops={true}
          onResult={() => undefined}
        />
        <EdgeProbe
          input={verticalEdge}
          hops={true}
          onResult={(hopped) => {
            topResults.push(hopped);
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();

    expect(topResults.at(-1)).toMatch(/A \d/);
  });

  it("returns null when hops are disabled", async () => {
    const results: (string | null)[] = [];

    render(
      <SmartEdgeProvider nodes={[]} options={{ routeOnlyWhenBlocked: false }}>
        <EdgeProbe
          input={verticalEdge}
          hops={undefined}
          onResult={(hopped) => {
            results.push(hopped);
          }}
        />
        <EdgeProbe
          input={horizontalEdge}
          hops={undefined}
          onResult={() => undefined}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();

    expect(results.at(-1)).toBeNull();
  });

  it("returns null for an editable edge even when hops are enabled", async () => {
    const results: (string | null)[] = [];

    render(
      <SmartEdgeProvider nodes={[]} options={{ routeOnlyWhenBlocked: false }}>
        <EdgeProbe
          input={verticalEdge}
          hops={true}
          editable={true}
          onResult={(hopped) => {
            results.push(hopped);
          }}
        />
        <EdgeProbe
          input={horizontalEdge}
          hops={true}
          onResult={() => undefined}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();

    expect(results.at(-1)).toBeNull();
  });

  it("returns null for a checkpoint edge even when hops are enabled", async () => {
    const results: (string | null)[] = [];

    render(
      <SmartEdgeProvider nodes={[]} options={{ routeOnlyWhenBlocked: false }}>
        <EdgeProbe
          input={verticalEdge}
          hops={true}
          checkpoints={true}
          onResult={(hopped) => {
            results.push(hopped);
          }}
        />
        <EdgeProbe
          input={horizontalEdge}
          hops={true}
          onResult={() => undefined}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();

    expect(results.at(-1)).toBeNull();
  });

  it("returns null while this edge's own route is still pending", () => {
    const results: (string | null)[] = [];

    render(
      <SmartEdgeProvider nodes={[]} options={{ routeOnlyWhenBlocked: false }}>
        <EdgeProbe
          input={verticalEdge}
          hops={true}
          onResult={(hopped) => {
            results.push(hopped);
          }}
        />
        <EdgeProbe
          input={horizontalEdge}
          hops={true}
          onResult={() => undefined}
        />
      </SmartEdgeProvider>,
    );

    // No `flushDebounce`: the scheduler has not published a route yet.
    expect(results.at(-1)).toBeNull();
  });

  it("returns null when this edge's own route resolved clear (unobstructed)", async () => {
    const results: (string | null)[] = [];

    render(
      <SmartEdgeProvider nodes={[]}>
        <EdgeProbe
          input={verticalEdge}
          hops={true}
          onResult={(hopped) => {
            results.push(hopped);
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();

    expect(results.at(-1)).toBeNull();
  });

  it("ignores an underneath edge of a different preset", async () => {
    const results: (string | null)[] = [];

    render(
      <SmartEdgeProvider nodes={[]} options={{ routeOnlyWhenBlocked: false }}>
        <EdgeProbe
          input={verticalEdge}
          hops={true}
          onResult={() => undefined}
        />
        <EdgeProbe
          input={{ ...horizontalEdge, preset: "bezier" }}
          hops={true}
          onResult={() => undefined}
        />
        <EdgeProbe
          input={{ ...verticalEdge, id: "v2", sourceX: 210, targetX: 210 }}
          hops={true}
          onResult={(hopped) => {
            results.push(hopped);
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();

    expect(results.at(-1)).not.toBeNull();
    expect(results.at(-1)).not.toMatch(/A \d/);
  });

  it("returns null outside a provider", () => {
    const results: (string | null)[] = [];

    render(
      <HopOnlyProbe
        edgeId="orphan"
        source={{ x: 0, y: 0 }}
        target={{ x: 100, y: 0 }}
        hops={true}
        onResult={(hopped) => {
          results.push(hopped);
        }}
      />,
    );

    expect(results.at(-1)).toBeNull();
  });

  it("resolves to null on the server, via the store's server snapshot", () => {
    const results: (string | null)[] = [];

    // Server rendering has no DOM and no effects: `useSyncExternalStore`
    // reads its `getServerSnapshot` argument instead of subscribing, which
    // is the only path that ever calls the hook's inert version getter.
    renderToStaticMarkup(
      <HopOnlyProbe
        edgeId="orphan"
        source={{ x: 0, y: 0 }}
        target={{ x: 100, y: 0 }}
        hops={true}
        onResult={(hopped) => {
          results.push(hopped);
        }}
      />,
    );

    expect(results.at(-1)).toBeNull();
  });

  it("returns null when a published route has no matching registration", () => {
    const contextBox: { current: SmartEdgeContextValue | null } = {
      current: null,
    };
    const results: (string | null)[] = [];

    render(
      <SmartEdgeProvider nodes={[]}>
        <ContextCapture
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
        <HopOnlyProbe
          edgeId="orphan"
          source={{ x: 0, y: 0 }}
          target={{ x: 100, y: 0 }}
          hops={true}
          onResult={(hopped) => {
            results.push(hopped);
          }}
        />
      </SmartEdgeProvider>,
    );

    act(() => {
      contextBox.current?.store.mergeRoutes({
        orphan: {
          kind: "routed",
          wasRouted: true,
          svgPathString: "M0,0 L100,0",
          edgeCenterX: 50,
          edgeCenterY: 0,
          points: [],
        },
      });
    });

    expect(results.at(-1)).toBeNull();
  });
});
