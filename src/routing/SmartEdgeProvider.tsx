import { useEffect, useMemo, useState } from "react";
import { getAbsoluteNodes } from "../functions";
import RoutingWorker from "./routing.worker?worker&inline";
import { createSmartEdgeStore } from "./providerStore";
import { createRoutingScheduler } from "./scheduler";
import {
  SmartEdgeRoutingContext,
  diffResolvedProviderOptions,
  resolveProviderOptions,
} from "./routingContext";
import { dispatchOnMainThread, createWorkerDispatcher } from "./workerDispatch";
import type { DispatchOutcome, WorkerLike } from "./workerDispatch";
import type {
  ResolvedProviderOptions,
  SmartEdgeContextValue,
  SmartEdgeProviderOptions,
} from "./routingContext";
import type {
  RegisteredSmartEdge,
  RoutingScheduler,
  SmartEdgeMetrics,
} from "./scheduler";
import type { SmartEdgeBatchItem } from "./routeBatch";
import type { Node } from "@xyflow/react";
import type { ReactNode } from "react";

export interface SmartEdgeProviderProps {
  /** All flow nodes (controlled pattern). Used as routing obstacles and as
   * the source of drag/selection state. */
  nodes: Node[];
  options?: SmartEdgeProviderOptions;
  onMetrics?: (metrics: SmartEdgeMetrics) => void;
  children: ReactNode;
}

/**
 * Projects React Flow nodes to the minimal shape routing needs — id,
 * position, size, parent, and the drag/selection flags the scheduler tracks
 * for its defer/invalidate decisions — dropping consumer `data` so the
 * payload posted to the worker is small and always structured-clone safe.
 */
const toRoutingNodes = (nodes: Node[]): Node[] =>
  nodes.map((node) => ({
    id: node.id,
    position: node.position,
    measured: node.measured,
    parentId: node.parentId,
    dragging: node.dragging,
    selected: node.selected,
    data: {},
  }));

/** Wraps the synchronous main-thread routing core in a resolved promise, so
 * it matches `SchedulerDeps["dispatch"]`'s async signature — the same shape
 * a worker dispatch resolves with, just without ever yielding to a worker. */
const dispatchOnMainThreadAsync = (
  nodes: Node[],
  edges: SmartEdgeBatchItem[],
): Promise<DispatchOutcome> =>
  Promise.resolve(dispatchOnMainThread(nodes, edges));

type DispatchFn = (
  nodes: Node[],
  edges: SmartEdgeBatchItem[],
) => Promise<DispatchOutcome>;

/**
 * One provider mount's whole mutable world, built once by `createController`
 * (held in `useState` so it survives strict-mode's double render) and
 * mutated only through its own methods afterward — the same encapsulation
 * style `createRoutingScheduler` uses.
 *
 * The scheduler itself is deliberately NOT a fixed field: React's Strict Mode
 * runs every effect's setup, then its cleanup, then its setup again, once
 * right after the initial mount — and `RoutingScheduler.dispose()` has no
 * undo. A scheduler tied to a plain "dispose on cleanup" effect would go
 * permanently dead after that one extra cleanup, silently breaking routing
 * for the rest of the component's real lifetime. `activateScheduler` /
 * `deactivateScheduler` instead give the scheduler the same "create in
 * effect, tear down in cleanup, safe to repeat" lifecycle already used for
 * the worker: each activation builds a fresh scheduler and immediately
 * replays every currently tracked registration and the latest routing nodes
 * into it, so nothing is lost across a strict-mode reset.
 */
interface Controller extends SmartEdgeContextValue {
  /** Creates a fresh scheduler, seeds it with every current registration and
   * the latest routing nodes, and makes it the active target for
   * `registerEdge`/`setRoutingNodes`. Returns the new instance so the caller
   * can dispose exactly that one later. */
  activateScheduler: () => RoutingScheduler;
  /** Disposes `scheduler` and, if it is still the active one, clears it. */
  deactivateScheduler: (scheduler: RoutingScheduler) => void;
  /** Replaces the routing-projected nodes forwarded to the active
   * scheduler's `setNodes`. */
  setRoutingNodes: (nodes: Node[]) => void;
  /** Swaps the live worker/main-thread dispatch implementation. */
  setDispatch: (dispatch: DispatchFn) => void;
  /** Replaces the callback `onMetrics` forwards each completed flush to. */
  setOnMetrics: (
    onMetrics: ((metrics: SmartEdgeMetrics) => void) | undefined,
  ) => void;
  /** Replaces the absolute-node snapshot `getNodesSnapshot` returns. */
  setAbsoluteNodes: (nodes: Node[]) => void;
  /** Applies a newly resolved options object in place. Returns true when
   * anything changed (so React context can re-render). Routing-affecting
   * changes also drop the route cache. */
  setOptions: (options: ResolvedProviderOptions) => boolean;
  /** Subscribes to options changes applied by `setOptions`. The listener
   * runs synchronously right after the live object is mutated, receiving a
   * shallow copy of the now-current options. Returns an unsubscribe
   * function. */
  subscribeOptions: (
    listener: (options: ResolvedProviderOptions) => void,
  ) => () => void;
}

const createController = (
  resolvedOptions: ResolvedProviderOptions,
): Controller => {
  let dispatchImpl: DispatchFn = dispatchOnMainThreadAsync;
  let onMetricsImpl: ((metrics: SmartEdgeMetrics) => void) | undefined;
  let absoluteNodes: Node[] = [];
  let routingNodes: Node[] = [];
  let nextOrder = 0;
  let activeScheduler: RoutingScheduler | null = null;
  const optionsListeners = new Set<
    (options: ResolvedProviderOptions) => void
  >();
  const registrations = new Map<string, RegisteredSmartEdge>();
  const schedulerUnregisterFns = new Map<string, () => void>();
  // First-seen paint order per edge id. Never evicted for the lifetime of
  // this provider: edge ids are expected to be stable within a flow, so an
  // edge that unregisters (endpoint change, brief unmount) and re-registers
  // under the same id keeps its original hop layering instead of jumping to
  // the end — re-minting on every call would flip Task 15's hop order every
  // time an edge's props merely change.
  const orders = new Map<string, number>();

  const store = createSmartEdgeStore();

  const registerWithActiveScheduler = (edge: RegisteredSmartEdge): void => {
    if (!activeScheduler) return;
    schedulerUnregisterFns.set(edge.id, activeScheduler.registerEdge(edge));
  };

  const orderFor = (edgeId: string): number => {
    const existing = orders.get(edgeId);
    if (existing !== undefined) return existing;

    nextOrder += 1;
    orders.set(edgeId, nextOrder);
    return nextOrder;
  };

  const registerEdge = (
    edge: Omit<RegisteredSmartEdge, "order">,
  ): (() => void) => {
    const registered: RegisteredSmartEdge = {
      ...edge,
      order: orderFor(edge.id),
    };
    registrations.set(registered.id, registered);
    registerWithActiveScheduler(registered);

    return () => {
      registrations.delete(registered.id);
      schedulerUnregisterFns.get(registered.id)?.();
      schedulerUnregisterFns.delete(registered.id);
    };
  };

  const activateScheduler = (): RoutingScheduler => {
    const scheduler = createRoutingScheduler({
      store,
      options: resolvedOptions,
      dispatch: (nodes, edges) => dispatchImpl(nodes, edges),
      onMetrics: (metrics) => {
        onMetricsImpl?.(metrics);
      },
    });

    activeScheduler = scheduler;
    schedulerUnregisterFns.clear();
    registrations.forEach(registerWithActiveScheduler);
    scheduler.setNodes(routingNodes);

    return scheduler;
  };

  /** Disposes the given scheduler and clears it as the active one. Only ever
   * called from the activation effect's own cleanup, which — because React
   * always runs an effect's cleanup before that same effect's next setup —
   * is always still targeting the current `activeScheduler` when it fires. */
  const deactivateScheduler = (scheduler: RoutingScheduler): void => {
    scheduler.dispose();
    activeScheduler = null;
  };

  return {
    store,
    options: resolvedOptions,
    optionsEpoch: resolvedOptions,
    registerEdge,
    getRegistrationsInOrder: () =>
      [...registrations.values()].sort(
        (left, right) => left.order - right.order,
      ),
    getNodesSnapshot: () => absoluteNodes,
    activateScheduler,
    deactivateScheduler,
    setRoutingNodes: (nodes) => {
      routingNodes = nodes;
      activeScheduler?.setNodes(nodes);
    },
    setDispatch: (dispatch) => {
      dispatchImpl = dispatch;
    },
    setOnMetrics: (onMetrics) => {
      onMetricsImpl = onMetrics;
    },
    setAbsoluteNodes: (nodes) => {
      absoluteNodes = nodes;
    },
    setOptions: (next) => {
      const diff = diffResolvedProviderOptions(resolvedOptions, next);
      if (!diff.any) return false;
      Object.assign(resolvedOptions, next);
      if (diff.routing) activeScheduler?.invalidateRoutes();
      const snapshot = { ...resolvedOptions };
      optionsListeners.forEach((listener) => {
        listener(snapshot);
      });
      return true;
    },
    subscribeOptions: (listener) => {
      optionsListeners.add(listener);
      return () => {
        optionsListeners.delete(listener);
      };
    },
  };
};

/**
 * Owns one `SmartEdgeStore`, one `RoutingScheduler`, and one inline routing
 * Web Worker for its lifetime, exposing them to descendants through
 * `SmartEdgeRoutingContext`. Falls back to synchronous main-thread routing
 * whenever `Worker` is unavailable, its construction throws, or it reports a
 * runtime error — edges keep routing either way. The `nodes` prop drives both
 * the scheduler's obstacle/drag state and `getNodesSnapshot` (absolute,
 * subflow-resolved coordinates for floating edges).
 */
export function SmartEdgeProvider({
  nodes,
  options,
  onMetrics,
  children,
}: Readonly<SmartEdgeProviderProps>) {
  const [controller] = useState(() =>
    createController(resolveProviderOptions(options)),
  );
  // Version tag for the context value. `setOptions` mutates the controller's
  // options object in place (the scheduler closes over that exact
  // reference), so a changed `options` prop leaves the object identity
  // intact. This tag is what changes identity instead, so memoized
  // descendants re-read `controller.options` after a live update.
  const [optionsEpoch, setOptionsEpoch] = useState<ResolvedProviderOptions>(
    () => controller.options,
  );

  useEffect(() => {
    controller.setOnMetrics(onMetrics);
  }, [controller, onMetrics]);

  // The controller's options object is external, mutable state from React's
  // perspective, so syncing the `options` prop into it is a genuine effect.
  useEffect(() => {
    controller.setOptions(resolveProviderOptions(options));
  }, [controller, options]);

  // The epoch update lives in a subscription callback, not in the sync
  // effect above: effects may only call setState in response to an external
  // system's notification, and the controller is that system here.
  useEffect(
    () =>
      controller.subscribeOptions((appliedOptions) => {
        setOptionsEpoch(appliedOptions);
      }),
    [controller],
  );

  useEffect(() => {
    controller.setAbsoluteNodes(getAbsoluteNodes(nodes));
    controller.setRoutingNodes(toRoutingNodes(nodes));
  }, [controller, nodes]);

  useEffect(() => {
    const scheduler = controller.activateScheduler();

    return () => {
      controller.deactivateScheduler(scheduler);
    };
  }, [controller]);

  useEffect(() => {
    if (typeof Worker === "undefined") return undefined;

    let worker: WorkerLike;
    try {
      worker = new RoutingWorker();
    } catch {
      return undefined;
    }

    controller.setDispatch(createWorkerDispatcher(worker).dispatch);

    return () => {
      controller.setDispatch(dispatchOnMainThreadAsync);
      worker.terminate();
    };
  }, [controller]);

  const contextValue = useMemo<SmartEdgeContextValue>(
    () => ({
      store: controller.store,
      options: controller.options,
      registerEdge: controller.registerEdge,
      getRegistrationsInOrder: controller.getRegistrationsInOrder,
      getNodesSnapshot: controller.getNodesSnapshot,
      optionsEpoch,
    }),
    [controller, optionsEpoch],
  );

  return (
    <SmartEdgeRoutingContext.Provider value={contextValue}>
      {children}
    </SmartEdgeRoutingContext.Provider>
  );
}
