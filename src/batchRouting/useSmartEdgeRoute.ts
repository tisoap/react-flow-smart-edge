import { useContext, useEffect, useRef, useSyncExternalStore } from "react";
import { RoutingContext } from "./routingContext";
import { buildEdgeInput } from "./edgeOptions";
import type { EdgeRouteInput } from "./edgeOptions";
import type { GetSmartEdgeReturn } from "../getSmartEdge";

const noopSubscribe = (): (() => void) => {
  return () => {
    // No provider in context: nothing to subscribe to.
  };
};

/**
 * Registers an edge's geometry with the nearest `SmartEdgeBatchRoutingProvider`
 * and returns its worker-routed path, or `null` while the route is pending (or
 * when used outside a provider). Pass the edge component's props; render a React
 * Flow native edge (e.g. `BezierEdge`) while this is `null`.
 */
export const useSmartEdgeRoute = (
  edge: EdgeRouteInput,
): GetSmartEdgeReturn | null => {
  const context = useContext(RoutingContext);
  const { id } = edge;

  const input = context ? buildEdgeInput(edge, context.defaults) : null;
  const signature = input ? JSON.stringify(input) : "";

  // Keep the latest input in a ref (updated in an effect, never during render)
  // so the signature-gated registration effect can read it.
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  });

  const registerEdge = context?.registerEdge;
  useEffect(() => {
    const current = inputRef.current;
    if (!registerEdge || !current) return undefined;
    return registerEdge(current);
  }, [registerEdge, signature]);

  return useSyncExternalStore(
    context ? context.store.subscribe : noopSubscribe,
    () => (context ? (context.store.getResult(id) ?? null) : null),
    () => null,
  );
};
