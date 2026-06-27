import { use, useSyncExternalStore } from "react";
import { RoutingStoreContext } from "./routingContext";
import type { GetSmartEdgeReturn } from "../getSmartEdge";

const noopSubscribe = (): (() => void) => {
  return () => {
    // No provider in context: nothing to subscribe to.
  };
};

/**
 * Returns the worker-routed path for an edge id, or `null` while the route is
 * pending (or when used outside a `SmartEdgeBatchRoutingProvider`). Render a
 * React Flow native edge (e.g. `BezierEdge`) when this is `null`.
 */
export const useSmartEdgeRoute = (
  edgeId: string,
): GetSmartEdgeReturn | null => {
  const store = use(RoutingStoreContext);

  return useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    () => (store ? (store.getResult(edgeId) ?? null) : null),
    () => null,
  );
};
