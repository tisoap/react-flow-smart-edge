import { useCallback, useSyncExternalStore } from "react";
import type { SmartEdgeStore } from "../routing/providerStore";

/** Inert unsubscribe used when there is no provider store to subscribe to. */
const inertUnsubscribe = (): void => {
  // No store in context: nothing to unsubscribe from.
};

const getIdleSelected = (): boolean => false;

/**
 * Subscribes to the provider store's selected-node set and reports whether
 * this edge's source or target node is currently selected. Used to decide
 * when an editable edge should reveal its draggable control points, without
 * reaching into React Flow's own store. Runs unconditionally; resolves to
 * `false` when there is no provider store.
 */
export const useEndpointNodesSelected = (
  store: SmartEdgeStore | undefined,
  source: string,
  target: string,
): boolean => {
  const subscribe = useCallback(
    (onChange: () => void): (() => void) =>
      store ? store.subscribeNodeState(onChange) : inertUnsubscribe,
    [store],
  );

  return useSyncExternalStore(
    subscribe,
    () => {
      if (!store) return false;
      const selected = store.getSelectedNodeIds();
      return selected.has(source) || selected.has(target);
    },
    getIdleSelected,
  );
};
