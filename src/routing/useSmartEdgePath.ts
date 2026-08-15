import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { SmartEdgeRoutingContext } from "./routingContext";
import type { SmartEdgeRouteResult } from "./providerStore";
import type { RegisteredSmartEdge } from "./scheduler";
import type { SmartEdgeBatchItem } from "./routeBatch";
import type { SmartEdgePreset } from "../smartEdgePresets";
import type { Position, XYPosition } from "@xyflow/react";

/** Everything an edge component needs to hand `useSmartEdgePath` to register
 * its routing geometry and read back its route. Mirrors `SmartEdgeBatchItem`
 * (Task 10) minus `preset`, which is optional here and defaults to the
 * nearest `SmartEdgeProvider`'s configured preset. */
export interface UseSmartEdgePathInput {
  id: string;
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  /** Defaults to the nearest `SmartEdgeProvider`'s `options.preset`. */
  preset?: SmartEdgePreset;
  /** Per-edge routing overrides (grid ratio, padding, avoid areas, corner
   * radius). */
  options?: NonNullable<SmartEdgeBatchItem["options"]>;
  waypoints?: XYPosition[];
}

export interface UseSmartEdgePathResult {
  /** `null` while the route is still pending (or when there is no
   * provider). */
  route: SmartEdgeRouteResult | null;
  /** True when this edge's source or target node is being dragged. */
  isDragging: boolean;
  /** False outside a `SmartEdgeProvider`; every other field is then inert. */
  hasProvider: boolean;
}

/** What a store subscription returns when there is no provider to
 * subscribe to. */
const inertUnsubscribe = (): void => {
  // No provider in context: nothing to unsubscribe from.
};

/* v8 ignore next 3 -- useSyncExternalStore server snapshot; unused in browser */
const getNullRoute = (): null => null;

/* v8 ignore next 3 -- useSyncExternalStore server snapshot; unused in browser */
const getIdleDragging = (): boolean => false;

/**
 * Registers one edge's routing geometry with the nearest `SmartEdgeProvider`
 * and subscribes to that edge's routed path and drag state.
 *
 * Mechanics mirror the 4.x `useSmartEdgeRoute`: building the registration
 * object is cheap, so it happens on every render, but a JSON signature of
 * that object gates the registration effect, so `registerEdge` only runs
 * again when the edge's routable geometry actually changed — not on every
 * unrelated re-render. The latest registration is kept in a ref (written in
 * its own effect, never during render) so the signature-gated effect can
 * read the current value without needing the object itself — which is
 * a fresh reference every render — in its dependency array.
 *
 * Every hook runs unconditionally, provider or not: outside a
 * `SmartEdgeProvider` this resolves to inert subscriptions and
 * `{ route: null, isDragging: false, hasProvider: false }`, which is also
 * exactly what a server render (no context, no DOM) produces.
 */
export const useSmartEdgePath = (
  input: UseSmartEdgePathInput,
): UseSmartEdgePathResult => {
  const context = useContext(SmartEdgeRoutingContext);
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    preset,
    options,
    waypoints,
  } = input;

  const registration: Omit<RegisteredSmartEdge, "order"> | null = context
    ? {
        id,
        source,
        target,
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        preset: preset ?? context.options.preset,
        options,
        waypoints,
      }
    : null;

  const signature = registration ? JSON.stringify(registration) : "";

  const registrationRef = useRef(registration);
  useEffect(() => {
    registrationRef.current = registration;
  });

  const registerEdge = context?.registerEdge;
  useEffect(() => {
    const current = registrationRef.current;
    if (!registerEdge || !current) return undefined;
    return registerEdge(current);
  }, [registerEdge, signature]);

  const store = context?.store;

  const subscribeEdge = useCallback(
    (onRouteChange: () => void): (() => void) => {
      if (!store) return inertUnsubscribe;
      return store.subscribeEdge(id, onRouteChange);
    },
    [store, id],
  );

  const route = useSyncExternalStore(
    subscribeEdge,
    () => store?.getRoute(id) ?? null,
    getNullRoute,
  );

  const subscribeNodeState = useCallback(
    (onNodeStateChange: () => void): (() => void) => {
      if (!store) return inertUnsubscribe;
      return store.subscribeNodeState(onNodeStateChange);
    },
    [store],
  );

  const isDragging = useSyncExternalStore(
    subscribeNodeState,
    () => {
      if (!store) return false;
      const draggingIds = store.getDraggingNodeIds();
      return draggingIds.has(source) || draggingIds.has(target);
    },
    getIdleDragging,
  );

  return {
    route,
    isDragging,
    hasProvider: context !== null,
  };
};
