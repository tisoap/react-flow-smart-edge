import { useCallback, useEffect, useMemo, useRef } from "react";
import RoutingWorker from "./routing.worker?worker&inline";
import { RoutingContext } from "./routingContext";
import { createRoutingStore } from "./routingStore";
import { routeSmartEdgesBatch } from "./routeSmartEdgesBatch";
import type { RoutingContextValue } from "./routingContext";
import type {
  BatchEdgeInput,
  BatchRoutingInput,
  SmartEdgeBatchOptions,
} from "./routeSmartEdgesBatch";
import type { RoutingRequest, RoutingResponse } from "./workerMessages";
import type { Node } from "@xyflow/react";
import type { ReactNode } from "react";

export interface SmartEdgeBatchRoutingProviderProps {
  /** All nodes in the flow, used as routing obstacles. */
  nodes: Node[];
  /** Defaults applied to every edge unless overridden via `edge.data.smartEdge`. */
  options?: SmartEdgeBatchOptions;
  children: ReactNode;
}

/**
 * Projects React Flow nodes to the minimal shape routing needs (id, position,
 * size, parent), dropping consumer `data` so the worker payload is small and
 * always structured-clone safe.
 */
const toRoutingNodes = (nodes: Node[]): Node[] =>
  nodes.map((node) => ({
    id: node.id,
    position: node.position,
    measured: node.measured,
    parentId: node.parentId,
    data: {},
  }));

/**
 * Owns one inlined routing Web Worker plus a per-edge results store. Edges
 * report their geometry through `useSmartEdgeRoute`; whenever the registered
 * edges or the nodes change, all edges are routed off the main thread in one
 * batch and the results are published to the store. Falls back to synchronous
 * main-thread routing when Web Workers are unavailable (e.g. SSR) or fail.
 *
 * Endpoints come from each edge's React Flow props, so the provider does not
 * read the flow store and can wrap `<ReactFlow>` from anywhere.
 */
export function SmartEdgeBatchRoutingProvider({
  nodes,
  options,
  children,
}: Readonly<SmartEdgeBatchRoutingProviderProps>) {
  const store = useMemo(() => createRoutingStore(), []);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const edgeInputsRef = useRef(new Map<string, BatchEdgeInput>());
  const routingNodesRef = useRef<Node[]>([]);
  const dispatchScheduledRef = useRef(false);

  const defaults = useMemo<SmartEdgeBatchOptions>(
    () => options ?? {},
    [options],
  );

  const routingNodes = useMemo(() => toRoutingNodes(nodes), [nodes]);

  const runDispatch = useCallback(() => {
    const requestId = (requestIdRef.current += 1);
    const input: BatchRoutingInput = {
      nodes: routingNodesRef.current,
      edges: [...edgeInputsRef.current.values()],
    };
    const worker = workerRef.current;

    if (worker) {
      const request: RoutingRequest = { ...input, requestId };
      worker.postMessage(request);
    } else {
      store.setResults(routeSmartEdgesBatch(input));
    }
  }, [store]);

  // Coalesce many edge registrations in the same tick into a single batch.
  const scheduleDispatch = useCallback(() => {
    if (dispatchScheduledRef.current) return;
    dispatchScheduledRef.current = true;
    queueMicrotask(() => {
      dispatchScheduledRef.current = false;
      runDispatch();
    });
  }, [runDispatch]);

  const registerEdge = useCallback(
    (input: BatchEdgeInput) => {
      edgeInputsRef.current.set(input.id, input);
      scheduleDispatch();
      return () => {
        edgeInputsRef.current.delete(input.id);
        scheduleDispatch();
      };
    },
    [scheduleDispatch],
  );

  // Re-route when the obstacle nodes change.
  useEffect(() => {
    routingNodesRef.current = routingNodes;
    scheduleDispatch();
  }, [routingNodes, scheduleDispatch]);

  useEffect(() => {
    if (typeof Worker === "undefined") return undefined;

    let worker: Worker;
    try {
      worker = new RoutingWorker();
    } catch {
      return undefined;
    }

    worker.onmessage = (event: MessageEvent<RoutingResponse>) => {
      if (event.data.requestId === requestIdRef.current) {
        store.setResults(event.data.results);
      }
    };
    // If the worker fails for any reason (blocked, crashed), drop it and route
    // on the main thread so edges still get paths.
    worker.onerror = () => {
      worker.terminate();
      workerRef.current = null;
      store.setResults(
        routeSmartEdgesBatch({
          nodes: routingNodesRef.current,
          edges: [...edgeInputsRef.current.values()],
        }),
      );
    };
    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [store]);

  const value = useMemo<RoutingContextValue>(
    () => ({ store, defaults, registerEdge }),
    [store, defaults, registerEdge],
  );

  return <RoutingContext value={value}>{children}</RoutingContext>;
}
