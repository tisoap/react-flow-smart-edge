import { getAbsoluteNodes } from "../functions";
import { createRouteCache } from "./routeCache";
import { snapshotNodes, diffNodeSnapshots } from "./invalidation";
import { runFlush } from "./schedulerFlush";
import type { CachedRoute } from "./schedulerFlush";
import type { RouteCache } from "./routeCache";
import type { EdgeRect } from "./invalidationCorridor";
import type { SmartEdgeStore, SmartEdgeRouteResult } from "./providerStore";
import type { SmartEdgeBatchItem } from "./routeBatch";
import type { Node, Rect } from "@xyflow/react";

/** Aggregate counters for one completed flush, reported via `onMetrics`. */
export interface SmartEdgeMetrics {
  batchId: number;
  executedOn: "worker" | "main";
  batchLatencyMs: number;
  /** Time spent running the batch on the main thread. `0` when the batch
   * ran on the worker, and `0` when the flush dispatched no edges. */
  mainThreadBlockingMs: number;
  routed: number;
  cacheHits: number;
  clear: number;
  deferred: number;
  unchanged: number;
}

/** One edge registered with the scheduler: everything a routing batch needs,
 * plus its registration order (hop paint order, a later task). */
export interface RegisteredSmartEdge extends SmartEdgeBatchItem {
  order: number;
}

/** The scheduling/routing options a provider resolves from its props (a
 * later task). Declared locally so this module has no dependency on that
 * provider; any structurally compatible object works here. */
export interface ResolvedProviderOptions {
  routeOnlyWhenBlocked: boolean;
  routeWhileDragging: boolean;
  debounceMs: number;
  nodePadding: number;
  gridRatio: number;
  avoidAreas: Rect[];
  cacheSize: number;
}

export interface SchedulerDeps {
  store: SmartEdgeStore;
  /** Executes a batch (worker or main thread) and resolves with results. */
  dispatch: (
    nodes: Node[],
    edges: SmartEdgeBatchItem[],
  ) => Promise<{
    results: Record<string, SmartEdgeRouteResult>;
    executedOn: "worker" | "main";
    durationMs: number;
  }>;
  options: ResolvedProviderOptions;
  onMetrics?: (metrics: SmartEdgeMetrics) => void;
}

export interface RoutingScheduler {
  registerEdge(edge: RegisteredSmartEdge): () => void;
  setNodes(nodes: Node[]): void;
  /** Drops cached routes and per-edge signatures so the next flush
   * re-decides every registered edge (used when provider options that
   * affect routing change). */
  invalidateRoutes(): void;
  /** Test hook: run the pending flush immediately. */
  flush(): Promise<void>;
  dispose(): void;
}

type NodeSnapshotList = ReturnType<typeof snapshotNodes>;

/** The scheduler's full mutable state, threaded through the free functions
 * below (and through `schedulerFlush.ts`'s flush pipeline) instead of
 * captured by closures — keeps every function short. */
export interface SchedulerState {
  edges: Map<string, RegisteredSmartEdge>;
  signatures: Map<string, string>;
  /** Each edge's actual-path invalidation corridor (bbox of the path it last
   * routed or cleared to, inflated by nodePadding + one grid cell), keyed by
   * edge id and kept alongside `signatures` for the same lifetime: set
   * whenever a route is produced, read by `isEdgeUnchanged` instead of a
   * fixed guess based only on the endpoints. See `schedulerFlush.ts`. */
  pathCorridors: Map<string, EdgeRect>;
  cache: RouteCache<CachedRoute>;
  deferredEdgeIds: Set<string>;
  draggingWasActive: boolean;
  rawNodes: Node[];
  absoluteNodes: Node[];
  snapshot: NodeSnapshotList;
  flushedSnapshot: NodeSnapshotList;
  batchId: number;
  disposed: boolean;
  flushScheduled: boolean;
  timerHandle: ReturnType<typeof setTimeout> | null;
  frameHandle: number | null;
}

const setsEqual = (
  first: ReadonlySet<string>,
  second: ReadonlySet<string>,
): boolean => {
  if (first.size !== second.size) return false;
  for (const item of first) {
    if (!second.has(item)) return false;
  }
  return true;
};

const cancelScheduledFlush = (state: SchedulerState): void => {
  state.flushScheduled = false;
  if (state.timerHandle !== null) {
    clearTimeout(state.timerHandle);
    state.timerHandle = null;
  }
  if (state.frameHandle !== null) {
    cancelAnimationFrame(state.frameHandle);
    state.frameHandle = null;
  }
};

/** Arms the debounce timer that actually runs the flush. Only ever called
 * while `flushScheduled` is true and immediately before this same timer
 * would be the next thing to fire, so once it fires there is nothing left
 * to guard: `cancelScheduledFlush` always clears this timer in the same
 * synchronous step it flips `flushScheduled` back to false, so a fired
 * callback can only ever observe `flushScheduled` still true. */
const armTimer = (deps: SchedulerDeps, state: SchedulerState): void => {
  state.timerHandle = setTimeout(() => {
    state.timerHandle = null;
    state.flushScheduled = false;
    void runFlush(deps, state);
  }, deps.options.debounceMs);
};

/** Coalesces same-tick registrations/node updates into one flush: the first
 * call after a flush arms a microtask → (frame →) timer chain; every call
 * while one is already pending is a no-op, since the eventual flush reads
 * live state and picks up every change made before it runs. */
const scheduleFlush = (deps: SchedulerDeps, state: SchedulerState): void => {
  if (state.disposed || state.flushScheduled) return;
  state.flushScheduled = true;

  void Promise.resolve().then(() => {
    if (!state.flushScheduled) return;

    if (typeof requestAnimationFrame === "undefined") {
      armTimer(deps, state);
      return;
    }

    state.frameHandle = requestAnimationFrame(() => {
      state.frameHandle = null;
      armTimer(deps, state);
    });
  });
};

const registerEdge = (
  deps: SchedulerDeps,
  state: SchedulerState,
  edge: RegisteredSmartEdge,
): (() => void) => {
  state.edges.set(edge.id, edge);
  scheduleFlush(deps, state);

  return () => {
    state.edges.delete(edge.id);
    state.signatures.delete(edge.id);
    state.pathCorridors.delete(edge.id);
    state.deferredEdgeIds.delete(edge.id);
  };
};

const setNodes = (
  deps: SchedulerDeps,
  state: SchedulerState,
  nodes: Node[],
): void => {
  if (state.disposed) return;

  const previousDragging = new Set(
    state.snapshot.filter((node) => node.dragging).map((node) => node.id),
  );
  const absoluteNodes = getAbsoluteNodes(nodes);
  const nextSnapshot = snapshotNodes(absoluteNodes);
  const diff = diffNodeSnapshots(
    state.flushedSnapshot,
    nextSnapshot,
    deps.options.nodePadding,
  );

  state.rawNodes = nodes;
  state.absoluteNodes = absoluteNodes;
  state.snapshot = nextSnapshot;

  deps.store.setNodeState(diff.draggingNodeIds, diff.selectedNodeIds);

  if (!diff.changed && setsEqual(previousDragging, diff.draggingNodeIds)) {
    return;
  }

  scheduleFlush(deps, state);
};

const invalidateRoutes = (deps: SchedulerDeps, state: SchedulerState): void => {
  if (state.disposed) return;

  state.cache = createRouteCache<CachedRoute>(deps.options.cacheSize);
  state.signatures.clear();
  state.pathCorridors.clear();
  scheduleFlush(deps, state);
};

/**
 * Coordinates routing for a set of registered smart edges as nodes change:
 * debounces registrations/node updates into one flush, decides per-edge
 * whether to defer, skip, serve from cache, mark clear, or dispatch to the
 * injected `dispatch`, then merges results, populates the cache, and reports
 * metrics. Pure — no React, no `Worker` construction; `dispatch` is supplied
 * by the caller (a provider wires the real worker/main-thread choice). The
 * per-flush decision pipeline lives in `schedulerFlush.ts`.
 */
export const createRoutingScheduler = (
  deps: SchedulerDeps,
): RoutingScheduler => {
  const state: SchedulerState = {
    edges: new Map(),
    signatures: new Map(),
    pathCorridors: new Map(),
    cache: createRouteCache<CachedRoute>(deps.options.cacheSize),
    deferredEdgeIds: new Set(),
    draggingWasActive: false,
    rawNodes: [],
    absoluteNodes: [],
    snapshot: [],
    flushedSnapshot: [],
    batchId: 0,
    disposed: false,
    flushScheduled: false,
    timerHandle: null,
    frameHandle: null,
  };

  return {
    registerEdge: (edge) => registerEdge(deps, state, edge),
    setNodes: (nodes) => {
      setNodes(deps, state, nodes);
    },
    invalidateRoutes: () => {
      invalidateRoutes(deps, state);
    },
    flush: () => {
      cancelScheduledFlush(state);
      return runFlush(deps, state);
    },
    dispose: () => {
      state.disposed = true;
      cancelScheduledFlush(state);
    },
  };
};
