import { Position } from "@xyflow/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createRoutingScheduler } from "./scheduler";
import { createSmartEdgeStore } from "./providerStore";
import { routeSmartEdgeBatch } from "./routeBatch";
import { corridorTouchesRects } from "./invalidation";
import { boundsOfPolyline } from "./invalidationCorridor";
import { CORRIDOR_MARGIN_CELLS } from "./corridor";
import { getSmartEdge } from "../getSmartEdge";
import type {
  RegisteredSmartEdge,
  SchedulerDeps,
  ResolvedProviderOptions,
  SmartEdgeMetrics,
} from "./scheduler";
import type { SmartEdgeRouteResult } from "./providerStore";
import type { SmartEdgeBatchItem } from "./routeBatch";
import type { Node } from "@xyflow/react";

/** A promise plus its own `resolve`, for tests that need to control exactly
 * when a dispatch call settles relative to other scheduler activity. */
interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

const deferred = <T>(): Deferred<T> => {
  let resolveFn: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise) => {
    resolveFn = resolvePromise;
  });
  return { promise, resolve: resolveFn };
};

type DispatchResult = Awaited<ReturnType<SchedulerDeps["dispatch"]>>;

/** `points` for a "routed" result now feeds the actual-path invalidation
 * corridor (see `schedulerFlush.ts`'s `actualPathCorridor`), so it can no
 * longer be an arbitrary placeholder: an empty array collapses the corridor
 * to `[Infinity, -Infinity]`, which never touches anything and silently
 * defeats invalidation. This default matches `makeEdge`'s own default
 * source/target, so `routedResult(svg)` stays a valid stand-in wherever a
 * test uses the default-coordinate edge; `autoDispatch` below always passes
 * the real per-edge coordinates instead of relying on this default. */
const DEFAULT_EDGE_POINTS: number[][] = [
  [50, 25],
  [300, 25],
];

const routedResult = (
  svgPathString: string,
  points: number[][] = DEFAULT_EDGE_POINTS,
): SmartEdgeRouteResult => ({
  kind: "routed",
  wasRouted: true,
  svgPathString,
  edgeCenterX: 0,
  edgeCenterY: 0,
  points,
});

const clearResult: SmartEdgeRouteResult = { kind: "clear", wasRouted: false };

/** A dispatch stub that behaves like the real thing: every edge handed to it
 * gets routed successfully, keyed by its own id, with a straight-line
 * `points` between its own source/target (no simulated detour) so the
 * actual-path corridor it produces lines up with that specific edge. */
const autoDispatch = (executedOn: "worker" | "main" = "main", durationMs = 1) =>
  vi.fn(
    (_nodes: Node[], edges: SmartEdgeBatchItem[]): Promise<DispatchResult> => {
      const results: Record<string, SmartEdgeRouteResult> = {};
      edges.forEach((item) => {
        results[item.id] = routedResult(`M-${item.id}`, [
          [item.sourceX, item.sourceY],
          [item.targetX, item.targetY],
        ]);
      });
      return Promise.resolve({ results, executedOn, durationMs });
    },
  );

const makeNode = (
  nodeId: string,
  posX: number,
  posY: number,
  overrides: Partial<Node> = {},
): Node => ({
  id: nodeId,
  position: { x: posX, y: posY },
  measured: { width: 50, height: 50 },
  data: {},
  ...overrides,
});

const makeEdge = (
  overrides: Partial<RegisteredSmartEdge> = {},
): RegisteredSmartEdge => ({
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
  order: 0,
  ...overrides,
});

const makeOptions = (
  overrides: Partial<ResolvedProviderOptions> = {},
): ResolvedProviderOptions => ({
  routeOnlyWhenBlocked: false,
  routeWhileDragging: false,
  debounceMs: 20,
  nodePadding: 10,
  gridRatio: 10,
  avoidAreas: [],
  cacheSize: 50,
  ...overrides,
});

const makeDeps = (overrides: Partial<SchedulerDeps> = {}): SchedulerDeps => ({
  store: createSmartEdgeStore(),
  dispatch: autoDispatch(),
  options: makeOptions(),
  ...overrides,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "requestAnimationFrame",
    (callback: FrameRequestCallback): number => {
      callback(0);
      return 0;
    },
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("createRoutingScheduler: coalescing (behavior 1)", () => {
  it("coalesces same-tick registrations into a single flush", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);
    const nodes = [makeNode("a", 0, 0), makeNode("b", 300, 0)];

    scheduler.setNodes(nodes);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    scheduler.registerEdge(makeEdge({ id: "e2", source: "a", target: "b" }));

    await vi.runAllTimersAsync();

    expect(dispatch).toHaveBeenCalledTimes(1);
    const [, dispatchedEdges] = dispatch.mock.calls[0];
    expect(
      dispatchedEdges
        .map((edge) => edge.id)
        .sort((left, right) => left.localeCompare(right)),
    ).toEqual(["e1", "e2"]);
  });
});

describe("createRoutingScheduler: setNodes (behavior 2)", () => {
  it("publishes dragging/selected node state immediately, before any debounce timer fires", () => {
    const deps = makeDeps();
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([
      makeNode("a", 0, 0, { dragging: true }),
      makeNode("b", 300, 0, { selected: true }),
    ]);

    expect(deps.store.getDraggingNodeIds()).toEqual(new Set(["a"]));
    expect(deps.store.getSelectedNodeIds()).toEqual(new Set(["b"]));
  });
});

describe("createRoutingScheduler: per-edge decisions (behavior 3)", () => {
  it("defers an edge whose endpoint is dragging when routeWhileDragging is false", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({
      dispatch,
      options: makeOptions({ routeWhileDragging: false }),
    });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([
      makeNode("a", 0, 0, { dragging: true }),
      makeNode("b", 300, 0),
    ]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await scheduler.flush();

    expect(dispatch).not.toHaveBeenCalled();
    expect(deps.store.getRoute("e1")).toBeUndefined();
  });

  it("skips an unchanged edge on a later flush with no relevant changes", async () => {
    const dispatch = autoDispatch();
    const onMetrics = vi.fn();
    const deps = makeDeps({ dispatch, onMetrics });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await scheduler.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);
    onMetrics.mockClear();

    await scheduler.flush();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(onMetrics).toHaveBeenCalledTimes(1);
    expect(onMetrics.mock.calls[0][0]).toMatchObject({
      unchanged: 1,
      routed: 0,
    });
  });

  it("serves a cache hit for a different edge with the same routing signature, and publishes it to the store", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "seed" }));
    await scheduler.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);

    scheduler.registerEdge(makeEdge({ id: "hit" }));
    await scheduler.flush();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(deps.store.getRoute("hit")).toBe(deps.store.getRoute("seed"));
  });

  it("does not cache-hit an edge whose per-edge gridRatio differs", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "seed" }));
    await scheduler.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);

    scheduler.registerEdge(makeEdge({ id: "fine", options: { gridRatio: 5 } }));
    await scheduler.flush();

    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it("still cache-hits a second edge with the same per-edge options", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "seed", options: { gridRatio: 5 } }));
    await scheduler.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);

    scheduler.registerEdge(makeEdge({ id: "hit", options: { gridRatio: 5 } }));
    await scheduler.flush();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(deps.store.getRoute("hit")).toBe(deps.store.getRoute("seed"));
  });

  it("publishes a clear result when the native (bezier) polyline is unblocked and routeOnlyWhenBlocked is set", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({
      dispatch,
      options: makeOptions({ routeOnlyWhenBlocked: true }),
    });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await scheduler.flush();

    expect(dispatch).not.toHaveBeenCalled();
    expect(deps.store.getRoute("e1")).toEqual(clearResult);
  });

  it("publishes a clear result for a step-like preset using nativeStepPolyline", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({
      dispatch,
      options: makeOptions({ routeOnlyWhenBlocked: true }),
    });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1", preset: "smoothstep" }));
    await scheduler.flush();

    expect(dispatch).not.toHaveBeenCalled();
    expect(deps.store.getRoute("e1")).toEqual(clearResult);
  });

  it("dispatches an edge whose native polyline is blocked, even when routeOnlyWhenBlocked is set", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({
      dispatch,
      options: makeOptions({ routeOnlyWhenBlocked: true }),
    });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([
      makeNode("a", 0, 0),
      makeNode("b", 300, 0),
      makeNode("wall", 150, 0),
    ]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await scheduler.flush();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(deps.store.getRoute("e1")).toEqual(routedResult("M-e1"));
  });
});

describe("createRoutingScheduler: dispatch merge + cache insertion (behavior 4)", () => {
  it("merges dispatch results into the store and inserts them into the cache with their corridor", async () => {
    const dispatchedPath = "M-dispatched";
    const dispatch = vi.fn(
      (): Promise<DispatchResult> =>
        Promise.resolve({
          results: { e1: routedResult(dispatchedPath) },
          executedOn: "worker",
          durationMs: 7,
        }),
    );
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await scheduler.flush();

    expect(deps.store.getRoute("e1")).toEqual(routedResult(dispatchedPath));

    // A second, differently-id'd edge with the same signature proves the
    // first dispatch's result was inserted into the cache (no new dispatch).
    scheduler.registerEdge(makeEdge({ id: "e2" }));
    await scheduler.flush();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(deps.store.getRoute("e2")).toEqual(routedResult(dispatchedPath));
  });

  it("does not merge anything when dispatch resolves with no results for the dispatched edges", async () => {
    const dispatch = vi.fn(
      (): Promise<DispatchResult> =>
        Promise.resolve({ results: {}, executedOn: "main", durationMs: 5 }),
    );
    const onMetrics = vi.fn();
    const deps = makeDeps({ dispatch, onMetrics });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await scheduler.flush();

    expect(deps.store.getRoute("e1")).toBeUndefined();
    expect(onMetrics).toHaveBeenCalledTimes(1);
    expect(onMetrics.mock.calls[0][0]).toMatchObject({ routed: 1 });
  });

  it("still merges a late result for an edge unregistered before the response arrived, but does not cache it", async () => {
    const pending = deferred<DispatchResult>();
    const dispatch = vi.fn(() => pending.promise);
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    const unregister = scheduler.registerEdge(makeEdge({ id: "e1" }));
    const flushPromise = scheduler.flush();
    unregister();

    pending.resolve({
      results: { e1: routedResult("M-late") },
      executedOn: "main",
      durationMs: 2,
    });
    await flushPromise;

    expect(deps.store.getRoute("e1")).toEqual(routedResult("M-late"));

    // Not cached: a fresh edge with the same signature must dispatch again.
    const secondDispatch = autoDispatch();
    const secondDeps = makeDeps({ dispatch: secondDispatch });
    const secondScheduler = createRoutingScheduler(secondDeps);
    secondScheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    secondScheduler.registerEdge(makeEdge({ id: "e2" }));
    await secondScheduler.flush();
    expect(secondDispatch).toHaveBeenCalledTimes(1);
  });
});

describe("createRoutingScheduler: stale batch protection (behavior 5)", () => {
  it("drops results from a superseded batch while applying the current one", async () => {
    const first = deferred<DispatchResult>();
    const second = deferred<DispatchResult>();
    const dispatch = vi
      .fn<SchedulerDeps["dispatch"]>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.registerEdge(makeEdge({ id: "e1" }));
    scheduler.setNodes([
      makeNode("a", 0, 0),
      makeNode("b", 300, 0),
      makeNode("c", 1000, 1000),
    ]);
    const flushA = scheduler.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);

    // Move the third (unrelated) node into the edge's routing corridor so the
    // second flush genuinely re-decides this edge instead of finding it
    // unchanged.
    scheduler.setNodes([
      makeNode("a", 0, 0),
      makeNode("b", 300, 0),
      makeNode("c", 150, 0),
    ]);
    const flushB = scheduler.flush();
    expect(dispatch).toHaveBeenCalledTimes(2);

    first.resolve({
      results: { e1: routedResult("M-stale") },
      executedOn: "main",
      durationMs: 1,
    });
    await flushA;
    expect(deps.store.getRoute("e1")).toBeUndefined();

    second.resolve({
      results: { e1: routedResult("M-current") },
      executedOn: "main",
      durationMs: 1,
    });
    await flushB;
    expect(deps.store.getRoute("e1")).toEqual(routedResult("M-current"));
  });

  it("treats a cache-key collision as a miss when the raw obstacle signature differs", async () => {
    // A genuine djb2 collision under `hashString`: with nodes "a" and "b"
    // fixed, a third node at x=5704 and one at x=115405 hash identically,
    // even though their obstacle boxes differ. A wide gridRatio inflates the
    // routing corridor enough for both positions to fall inside it.
    const dispatch = autoDispatch();
    const deps = makeDeps({
      dispatch,
      options: makeOptions({ nodePadding: 0, gridRatio: 15000 }),
    });
    const scheduler = createRoutingScheduler(deps);

    scheduler.registerEdge(makeEdge({ id: "e1" }));
    scheduler.setNodes([
      makeNode("a", 0, 0),
      makeNode("b", 300, 0),
      makeNode("c", 5704, 0),
    ]);
    await scheduler.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);

    scheduler.setNodes([
      makeNode("a", 0, 0),
      makeNode("b", 300, 0),
      makeNode("c", 115405, 0),
    ]);
    await scheduler.flush();

    // Despite the colliding cache key, the mismatched raw signature forces a
    // real dispatch instead of a false cache hit.
    expect(dispatch).toHaveBeenCalledTimes(2);
  });
});

describe("createRoutingScheduler: drag-end forcing (behavior 6)", () => {
  it("forces a previously deferred edge into the next flush when dragging ends, even with an unchanged signature", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({
      dispatch,
      options: makeOptions({ routeWhileDragging: false }),
    });
    const scheduler = createRoutingScheduler(deps);

    scheduler.registerEdge(makeEdge({ id: "e1" }));
    scheduler.setNodes([
      makeNode("a", 0, 0, { dragging: true }),
      makeNode("b", 300, 0),
    ]);
    await scheduler.flush();
    expect(dispatch).not.toHaveBeenCalled();

    scheduler.setNodes([
      makeNode("a", 0, 0, { dragging: false }),
      makeNode("b", 300, 0),
    ]);
    await scheduler.flush();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(deps.store.getRoute("e1")).toEqual(routedResult("M-e1"));
  });
});

describe("createRoutingScheduler: metrics (behavior 7)", () => {
  it("reports onMetrics once per completed flush with counts for every decision category", async () => {
    const dispatch = autoDispatch();
    const onMetrics = vi.fn<(metrics: SmartEdgeMetrics) => void>();
    const deps = makeDeps({
      dispatch,
      onMetrics,
      options: makeOptions({
        routeOnlyWhenBlocked: true,
        routeWhileDragging: false,
      }),
    });
    const scheduler = createRoutingScheduler(deps);

    // Lane "u": unchanged on the second flush (no obstacle -> clear on 1st).
    // Lane "c": seeds + hits the cache (obstacle blocks it -> dispatched).
    // Lane "d": deferred (dragging endpoint).
    // Lane "cl": clear (no obstacle).
    // Lane "r": dispatched (obstacle blocks it).
    scheduler.registerEdge(
      makeEdge({
        id: "unchanged1",
        source: "u-a",
        target: "u-b",
        sourceX: 50,
        targetX: 300,
      }),
    );
    const unregisterCacheSeed = scheduler.registerEdge(
      makeEdge({
        id: "cacheSeed",
        source: "c-a",
        target: "c-b",
        sourceX: 1050,
        targetX: 1300,
      }),
    );
    scheduler.setNodes([
      makeNode("u-a", 0, 0),
      makeNode("u-b", 300, 0),
      makeNode("c-a", 1000, 0),
      makeNode("c-b", 1300, 0),
      makeNode("c-wall", 1150, 0),
    ]);
    await scheduler.flush();
    onMetrics.mockClear();
    // Unregister the cache-seeding edge so the next flush counts the fresh
    // "cacheHit" edge in its own bucket, not this one as "unchanged" again.
    unregisterCacheSeed();

    scheduler.registerEdge(
      makeEdge({
        id: "cacheHit",
        source: "c-a",
        target: "c-b",
        sourceX: 1050,
        targetX: 1300,
      }),
    );
    scheduler.registerEdge(
      makeEdge({
        id: "deferred1",
        source: "d-a",
        target: "d-b",
        sourceX: 2050,
        targetX: 2300,
      }),
    );
    scheduler.registerEdge(
      makeEdge({
        id: "clearFinal",
        source: "cl-a",
        target: "cl-b",
        sourceX: 3050,
        targetX: 3300,
      }),
    );
    scheduler.registerEdge(
      makeEdge({
        id: "routedBlocked",
        source: "r-a",
        target: "r-b",
        sourceX: 4050,
        targetX: 4300,
      }),
    );
    scheduler.setNodes([
      makeNode("u-a", 0, 0),
      makeNode("u-b", 300, 0),
      makeNode("c-a", 1000, 0),
      makeNode("c-b", 1300, 0),
      makeNode("c-wall", 1150, 0),
      makeNode("d-a", 2000, 0, { dragging: true }),
      makeNode("d-b", 2300, 0),
      makeNode("cl-a", 3000, 0),
      makeNode("cl-b", 3300, 0),
      makeNode("r-a", 4000, 0),
      makeNode("r-b", 4300, 0),
      makeNode("r-wall", 4150, 0),
    ]);
    await scheduler.flush();

    expect(onMetrics).toHaveBeenCalledTimes(1);
    const metrics: SmartEdgeMetrics = onMetrics.mock.calls[0][0];
    expect(metrics).toMatchObject({
      routed: 1,
      cacheHits: 1,
      clear: 1,
      deferred: 1,
      unchanged: 1,
      executedOn: "main",
    });
  });
});

describe("createRoutingScheduler: dispose (behavior 8)", () => {
  it("cancels a pending debounce timer so no flush occurs", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    // Let the microtask -> rAF -> timer chain arm the debounce timer.
    await Promise.resolve();

    scheduler.dispose();
    await vi.runAllTimersAsync();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("cancels a same-tick pending flush before its microtask even runs", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    // Dispose before the queued microtask (which would otherwise arm the
    // rAF/timer chain) ever gets a chance to run.
    scheduler.dispose();
    await vi.runAllTimersAsync();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("flush() called after dispose does not run another flush", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    scheduler.dispose();

    await scheduler.flush();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("ignores a late dispatch resolution after dispose", async () => {
    const pending = deferred<DispatchResult>();
    const dispatch = vi.fn(() => pending.promise);
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    const flushPromise = scheduler.flush();

    scheduler.dispose();
    pending.resolve({
      results: { e1: routedResult("M-late") },
      executedOn: "main",
      durationMs: 1,
    });
    await flushPromise;

    expect(deps.store.getRoute("e1")).toBeUndefined();
  });

  it("does not throw when disposed with nothing ever scheduled", () => {
    const scheduler = createRoutingScheduler(makeDeps());

    expect(() => {
      scheduler.dispose();
    }).not.toThrow();
  });
});

describe("createRoutingScheduler: registration lifecycle and edge cases", () => {
  it("stops processing an edge once its unregister callback is called", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    const unregister = scheduler.registerEdge(makeEdge({ id: "e1" }));
    unregister();
    await scheduler.flush();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("ignores setNodes after dispose", () => {
    const deps = makeDeps();
    const scheduler = createRoutingScheduler(deps);
    scheduler.dispose();

    scheduler.setNodes([makeNode("a", 0, 0, { dragging: true })]);

    expect(deps.store.getDraggingNodeIds()).toEqual(new Set());
  });

  it("does not schedule a flush for a registration made after dispose", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);
    scheduler.dispose();

    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await vi.runAllTimersAsync();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("falls back straight to the debounce timer when requestAnimationFrame is unavailable", async () => {
    vi.stubGlobal("requestAnimationFrame", undefined);
    const dispatch = autoDispatch();
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await vi.runAllTimersAsync();

    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe("createRoutingScheduler: actual-path corridor invalidation (task 23 regression)", () => {
  // A wall tall enough that routing around it (over the top, the only way
  // through) lands the path well outside the OLD fixed rung-0 invalidation
  // corridor (the endpoint bbox +/- CORRIDOR_MARGIN_CELLS[0] * gridRatio =
  // 80px at these defaults), while still being resolvable by
  // `buildCorridorAttempt`'s own reselect-fixpoint growth of the routing
  // grid box (see `corridor.ts`) — i.e. a real detour, not a contrived one.
  const WALL_NODE_OVERRIDES = { measured: { width: 20, height: 300 } };
  const wallFixtureNodes = (moverX: number, moverY: number): Node[] => [
    makeNode("a", 0, 0),
    makeNode("b", 300, 0),
    makeNode("wall", 140, -125, WALL_NODE_OVERRIDES),
    makeNode("mover", moverX, moverY),
  ];

  const realDispatch = (): SchedulerDeps["dispatch"] =>
    vi.fn(
      (nodes: Node[], edges: SmartEdgeBatchItem[]): Promise<DispatchResult> =>
        Promise.resolve({
          results: routeSmartEdgeBatch(nodes, edges),
          executedOn: "main",
          durationMs: 1,
        }),
    );

  it("verifies the fixture: getSmartEdge bulges more than 80px beyond the endpoint bbox to get around the wall", () => {
    const direct = getSmartEdge({
      sourceX: 50,
      sourceY: 25,
      targetX: 300,
      targetY: 25,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      nodes: [
        makeNode("a", 0, 0),
        makeNode("b", 300, 0),
        makeNode("wall", 140, -125, WALL_NODE_OVERRIDES),
      ],
      options: { nodePadding: 10, gridRatio: 10 },
    });

    if (direct instanceof Error) {
      throw direct;
    }

    const bulge = Math.max(...direct.points.map(([, pointY]) => pointY)) - 25;
    expect(bulge).toBeGreaterThan(80);
  });

  it("re-routes an edge when a node moves into its actual detour band, even though that spot never touched the old rung-0 corridor", async () => {
    const dispatch = realDispatch();
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes(wallFixtureNodes(2000, 2000));
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await scheduler.flush();

    expect(dispatch).toHaveBeenCalledTimes(1);
    const firstRoute = deps.store.getRoute("e1");
    if (firstRoute?.kind !== "routed") {
      throw new Error("expected e1 to be routed on the first flush");
    }

    // The old (buggy) invalidation region: the endpoint bbox inflated by
    // just the rung-0 margin, with no knowledge of the actual detour.
    const oldRung0Corridor = {
      xMin: Math.min(50, 300) - CORRIDOR_MARGIN_CELLS[0] * 10,
      xMax: Math.max(50, 300) + CORRIDOR_MARGIN_CELLS[0] * 10,
      yMin: Math.min(25, 25) - CORRIDOR_MARGIN_CELLS[0] * 10,
      yMax: Math.max(25, 25) + CORRIDOR_MARGIN_CELLS[0] * 10,
    };
    // The fixed region this task makes the scheduler use instead: the bbox
    // of the path `e1` actually drew, inflated by nodePadding + gridRatio.
    const actualPathCorridor = boundsOfPolyline(
      firstRoute.points.map(([pointX, pointY]) => ({ x: pointX, y: pointY })),
      20,
    );

    const moverRect = { xMin: 140, yMin: 140, xMax: 210, yMax: 210 };
    expect(corridorTouchesRects(oldRung0Corridor, [moverRect])).toBe(false);
    expect(corridorTouchesRects(actualPathCorridor, [moverRect])).toBe(true);

    scheduler.setNodes(wallFixtureNodes(150, 150));
    await scheduler.flush();

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(deps.store.getRoute("e1")).not.toBe(firstRoute);
  });

  it("companion: still skips the edge when a node moves far from its actual routed path, proving invalidation isn't just disabled", async () => {
    const dispatch = realDispatch();
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes(wallFixtureNodes(2000, 2000));
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await scheduler.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);

    // Moves, but stays far from both the endpoints and the wall detour.
    scheduler.setNodes(wallFixtureNodes(5000, 5000));
    await scheduler.flush();

    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe("createRoutingScheduler: selection vs drag vs invalidateRoutes", () => {
  it("does not dispatch when only node.selected changes", async () => {
    const dispatch = autoDispatch();
    const onMetrics = vi.fn();
    const deps = makeDeps({ dispatch, onMetrics });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await scheduler.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);
    onMetrics.mockClear();

    scheduler.setNodes([
      makeNode("a", 0, 0, { selected: true }),
      makeNode("b", 300, 0),
    ]);
    await vi.runAllTimersAsync();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(onMetrics).not.toHaveBeenCalled();
    expect(deps.store.getSelectedNodeIds()).toEqual(new Set(["a"]));
  });

  it("still flushes when dragging flips without a position change", async () => {
    const dispatch = autoDispatch();
    const onMetrics = vi.fn();
    const deps = makeDeps({
      dispatch,
      onMetrics,
      options: makeOptions({ routeWhileDragging: false }),
    });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await scheduler.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(deps.store.getRoute("e1")).toMatchObject({ kind: "routed" });

    scheduler.setNodes([
      makeNode("a", 0, 0, { dragging: true }),
      makeNode("b", 300, 0),
    ]);
    await scheduler.flush();

    expect(deps.store.getDraggingNodeIds()).toEqual(new Set(["a"]));
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(onMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ deferred: 1 }),
    );
  });

  it("does not flush when dragging continues on the same node without a position change", async () => {
    const dispatch = autoDispatch();
    const onMetrics = vi.fn();
    const deps = makeDeps({
      dispatch,
      onMetrics,
      options: makeOptions({ routeWhileDragging: false }),
    });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await scheduler.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);
    onMetrics.mockClear();

    scheduler.setNodes([
      makeNode("a", 0, 0, { dragging: true }),
      makeNode("b", 300, 0),
    ]);
    await scheduler.flush();
    expect(onMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ deferred: 1 }),
    );
    onMetrics.mockClear();

    scheduler.setNodes([
      makeNode("a", 0, 0, { dragging: true }),
      makeNode("b", 300, 0),
    ]);
    await vi.runAllTimersAsync();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(onMetrics).not.toHaveBeenCalled();
  });

  it("flushes when the dragging node swaps without a position change", async () => {
    const dispatch = autoDispatch();
    const onMetrics = vi.fn();
    const deps = makeDeps({
      dispatch,
      onMetrics,
      options: makeOptions({ routeWhileDragging: false }),
    });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await scheduler.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);
    onMetrics.mockClear();

    scheduler.setNodes([
      makeNode("a", 0, 0, { dragging: true }),
      makeNode("b", 300, 0),
    ]);
    await scheduler.flush();
    onMetrics.mockClear();

    scheduler.setNodes([
      makeNode("a", 0, 0),
      makeNode("b", 300, 0, { dragging: true }),
    ]);
    await scheduler.flush();

    expect(deps.store.getDraggingNodeIds()).toEqual(new Set(["b"]));
    expect(onMetrics).toHaveBeenCalledWith(
      expect.objectContaining({ deferred: 1 }),
    );
  });

  it("invalidateRoutes drops the cache so the next flush dispatches again", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await scheduler.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);

    scheduler.invalidateRoutes();
    await scheduler.flush();

    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it("invalidateRoutes after dispose is a no-op", async () => {
    const dispatch = autoDispatch();
    const deps = makeDeps({ dispatch });
    const scheduler = createRoutingScheduler(deps);

    scheduler.setNodes([makeNode("a", 0, 0), makeNode("b", 300, 0)]);
    scheduler.registerEdge(makeEdge({ id: "e1" }));
    await scheduler.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);

    scheduler.dispose();
    scheduler.invalidateRoutes();
    await vi.runAllTimersAsync();

    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
