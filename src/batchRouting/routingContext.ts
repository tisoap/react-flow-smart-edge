import { createContext } from "react";
import type { RoutingStore } from "./routingStore";
import type {
  BatchEdgeInput,
  SmartEdgeBatchOptions,
} from "./routeSmartEdgesBatch";

export interface RoutingContextValue {
  /** Per-edge routed results, read by `useSmartEdgeRoute`. */
  store: RoutingStore;
  /** Provider defaults merged into every edge's options. */
  defaults: SmartEdgeBatchOptions;
  /**
   * Register an edge's geometry for routing. Returns an unregister function.
   * Registering or unregistering schedules a (coalesced) batch re-route.
   */
  registerEdge: (input: BatchEdgeInput) => () => void;
}

/**
 * Holds the active routing context for the nearest
 * `SmartEdgeBatchRoutingProvider`. `null` when no provider is mounted, in which
 * case `useSmartEdgeRoute` returns `null` and edges should render a fallback.
 */
export const RoutingContext = createContext<RoutingContextValue | null>(null);
