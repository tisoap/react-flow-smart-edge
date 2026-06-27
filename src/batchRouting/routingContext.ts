import { createContext } from "react";
import type { RoutingStore } from "./routingStore";

/**
 * Holds the active {@link RoutingStore} for the nearest
 * `SmartEdgeBatchRoutingProvider`. `null` when no provider is mounted, in which
 * case `useSmartEdgeRoute` returns `null` and edges should render a fallback.
 */
export const RoutingStoreContext = createContext<RoutingStore | null>(null);
