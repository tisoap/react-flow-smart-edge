import type { GetSmartEdgeReturn } from "../getSmartEdge";
import type { BatchRoutingResults } from "./routeSmartEdgesBatch";

/**
 * A tiny external store of routed paths keyed by edge id, designed for
 * `useSyncExternalStore`. Each routed result keeps a stable reference between
 * `setResults` calls so per-edge subscribers only re-render when their own
 * result changes.
 */
export interface RoutingStore {
  subscribe: (listener: () => void) => () => void;
  getResult: (edgeId: string) => GetSmartEdgeReturn | undefined;
  setResults: (results: BatchRoutingResults) => void;
}

export const createRoutingStore = (): RoutingStore => {
  let results: BatchRoutingResults = {};
  const listeners = new Set<() => void>();

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getResult: (edgeId) => results[edgeId],
    setResults: (next) => {
      results = next;
      listeners.forEach((listener) => {
        listener();
      });
    },
  };
};
