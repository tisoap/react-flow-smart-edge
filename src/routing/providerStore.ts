import type { GetSmartEdgeReturn } from "../getSmartEdge";

/**
 * One edge's routing outcome as tracked by the provider store. `"routed"`
 * carries a full `getSmartEdge` result; `"clear"` tells the edge component
 * to render its native (non-smart) path locally instead, e.g. while an
 * async route is still pending or after routing failed.
 */
export type SmartEdgeRouteResult =
  | ({ kind: "routed"; wasRouted: true } & GetSmartEdgeReturn)
  | { kind: "clear"; wasRouted: false };

/**
 * Keyed external store for smart-edge routes plus graph-wide node
 * drag/selection state, shaped for `useSyncExternalStore`: every getter
 * returns a stable reference until the slice it reads actually changes, so
 * React can skip re-rendering subscribers whose data was untouched.
 */
export interface SmartEdgeStore {
  /** Subscribes to changes for one edge's route. Returns an unsubscribe
   * function. */
  subscribeEdge(edgeId: string, listener: () => void): () => void;
  /** The edge's current route, or `undefined` if none has been set (or it
   * was removed). Stable by reference until that edge's route changes. */
  getRoute(edgeId: string): SmartEdgeRouteResult | undefined;
  /** Applies a batch of route updates, notifying only the listeners of ids
   * whose stored value reference actually changed. */
  mergeRoutes(patch: Record<string, SmartEdgeRouteResult>): void;
  /** Deletes the stored route for each id and notifies its listeners (who
   * will then read `undefined` from `getRoute`). */
  removeRoutes(edgeIds: string[]): void;
  /** Subscribes to every route change: any `mergeRoutes`/`removeRoutes` call
   * that actually changed at least one stored route. Coarser than
   * `subscribeEdge` (fires for any edge's change, not just one id) — used by
   * consumers that need to react to a neighbor's route without tracking
   * every neighbor individually (e.g. hop bridges). Returns an unsubscribe
   * function. */
  subscribeAllRoutes(listener: () => void): () => void;
  /** A counter incremented once per actual route change (any id). Read
   * through `useSyncExternalStore` alongside `subscribeAllRoutes`: a bare
   * number is trivially stable-by-value, so snapshots never need a custom
   * equality check. */
  getRoutesVersion(): number;
  /** Subscribes to changes in dragging/selected node state. Returns an
   * unsubscribe function. */
  subscribeNodeState(listener: () => void): () => void;
  /** The current set of dragging node ids. Stable by reference until the
   * set's contents change. */
  getDraggingNodeIds(): ReadonlySet<string>;
  /** The current set of selected node ids. Stable by reference until the
   * set's contents change. */
  getSelectedNodeIds(): ReadonlySet<string>;
  /** Replaces the dragging/selected node sets, notifying node-state
   * listeners only if either set's contents actually changed. */
  setNodeState(dragging: Set<string>, selected: Set<string>): void;
}

/**
 * True when two sets contain exactly the same elements, regardless of
 * insertion order. Used to decide whether a node-state update actually
 * changed anything, so `useSyncExternalStore` snapshots stay referentially
 * stable across no-op updates and React does not loop re-rendering.
 */
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

/** Calls every listener currently in a set, if any are registered. Shared
 * by the per-edge and node-state notification paths. */
const notifyAll = (listeners: Set<() => void> | undefined): void => {
  if (listeners === undefined) return;

  listeners.forEach((listener) => {
    listener();
  });
};

/**
 * Creates a fresh, isolated `SmartEdgeStore`. One instance is meant to live
 * for the lifetime of a `SmartEdgeProvider`; this factory holds no shared
 * module-level state, so multiple providers never interfere.
 */
export const createSmartEdgeStore = (): SmartEdgeStore => {
  const routes = new Map<string, SmartEdgeRouteResult>();
  const edgeListeners = new Map<string, Set<() => void>>();
  const allRoutesListeners = new Set<() => void>();
  const nodeStateListeners = new Set<() => void>();

  let draggingNodeIds: ReadonlySet<string> = new Set();
  let selectedNodeIds: ReadonlySet<string> = new Set();
  let routesVersion = 0;

  /** Bumps `routesVersion` and notifies `subscribeAllRoutes` listeners.
   * Called once per `mergeRoutes`/`removeRoutes` call that changed at least
   * one route — never per individual id — so a batch touching many edges
   * still only produces one version bump. */
  const notifyRoutesChanged = (): void => {
    routesVersion += 1;
    notifyAll(allRoutesListeners);
  };

  return {
    subscribeEdge(edgeId, listener) {
      let listeners = edgeListeners.get(edgeId);
      if (listeners === undefined) {
        listeners = new Set();
        edgeListeners.set(edgeId, listeners);
      }
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) edgeListeners.delete(edgeId);
      };
    },

    getRoute(edgeId) {
      return routes.get(edgeId);
    },

    mergeRoutes(patch) {
      let changed = false;

      for (const [edgeId, value] of Object.entries(patch)) {
        if (routes.get(edgeId) === value) continue;

        routes.set(edgeId, value);
        notifyAll(edgeListeners.get(edgeId));
        changed = true;
      }

      if (changed) notifyRoutesChanged();
    },

    removeRoutes(edgeIds) {
      let changed = false;

      for (const edgeId of edgeIds) {
        if (routes.has(edgeId)) changed = true;
        routes.delete(edgeId);
        notifyAll(edgeListeners.get(edgeId));
      }

      if (changed) notifyRoutesChanged();
    },

    subscribeAllRoutes(listener) {
      allRoutesListeners.add(listener);

      return () => {
        allRoutesListeners.delete(listener);
      };
    },

    getRoutesVersion() {
      return routesVersion;
    },

    subscribeNodeState(listener) {
      nodeStateListeners.add(listener);

      return () => {
        nodeStateListeners.delete(listener);
      };
    },

    getDraggingNodeIds() {
      return draggingNodeIds;
    },

    getSelectedNodeIds() {
      return selectedNodeIds;
    },

    setNodeState(dragging, selected) {
      let changed = false;

      if (!setsEqual(draggingNodeIds, dragging)) {
        draggingNodeIds = dragging;
        changed = true;
      }

      if (!setsEqual(selectedNodeIds, selected)) {
        selectedNodeIds = selected;
        changed = true;
      }

      if (changed) notifyAll(nodeStateListeners);
    },
  };
};
