import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStore } from "@xyflow/react";
import RoutingWorker from "./routing.worker?worker&inline";
import { RoutingStoreContext } from "./routingContext";
import { createRoutingStore } from "./routingStore";
import { routeSmartEdgesBatch } from "./routeSmartEdgesBatch";
import { isSmartEdgePreset } from "./routingRegistry";
import { getEdgeEndpointsFromStore } from "../functions";
import type { InternalNodeLike } from "../functions";
import type {
  BatchEdgeInput,
  BatchRoutingInput,
  SerializableSmartEdgeOptions,
} from "./routeSmartEdgesBatch";
import type { RoutingRequest, RoutingResponse } from "./workerMessages";
import type { SmartEdgePreset } from "../smartEdgePresets";
import type { Edge, Node, Rect } from "@xyflow/react";
import type { ReactNode } from "react";

/** Default routing config for every edge, with an optional default preset. */
export interface SmartEdgeBatchOptions extends SerializableSmartEdgeOptions {
  preset?: SmartEdgePreset;
}

/** Per-edge override, read from `edge.data.smartEdge`. */
export interface SmartEdgeBatchOverride {
  preset?: SmartEdgePreset;
  options?: SerializableSmartEdgeOptions;
}

/** The `edge.data` shape the provider reads per-edge routing overrides from. */
export interface SmartEdgeBatchEdgeData extends Record<string, unknown> {
  smartEdge?: SmartEdgeBatchOverride;
}

export interface SmartEdgeBatchRoutingProviderProps {
  nodes: Node[];
  edges: Edge[];
  /** Defaults applied to every edge unless overridden via `edge.data.smartEdge`. */
  options?: SmartEdgeBatchOptions;
  children: ReactNode;
}

const DEFAULT_PRESET: SmartEdgePreset = "bezier";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isRect = (value: unknown): value is Rect => {
  if (!isRecord(value)) return false;
  return (
    typeof value["x"] === "number" &&
    typeof value["y"] === "number" &&
    typeof value["width"] === "number" &&
    typeof value["height"] === "number"
  );
};

const readNumber = (
  record: Record<string, unknown>,
  key: string,
): number | undefined => {
  const value = record[key];
  return typeof value === "number" ? value : undefined;
};

/** Reads the serializable routing options from an arbitrary `data.options`. */
const readSerializableOptions = (
  value: unknown,
): SerializableSmartEdgeOptions => {
  if (!isRecord(value)) return {};
  const avoidAreas = value["avoidAreas"];
  return {
    gridRatio: readNumber(value, "gridRatio"),
    nodePadding: readNumber(value, "nodePadding"),
    borderRadius: readNumber(value, "borderRadius"),
    avoidAreas: Array.isArray(avoidAreas)
      ? avoidAreas.filter(isRect)
      : undefined,
  };
};

/** Reads `{ preset, options }` from an edge's `data.smartEdge`, tolerating junk. */
const readEdgeOverride = (data: unknown): SmartEdgeBatchOverride => {
  if (!isRecord(data) || !isRecord(data["smartEdge"])) return {};
  const smartEdge = data["smartEdge"];
  const preset = smartEdge["preset"];
  return {
    preset: isSmartEdgePreset(preset) ? preset : undefined,
    options: readSerializableOptions(smartEdge["options"]),
  };
};

/** Merges default options with an edge override, ignoring undefined overrides. */
const mergeOptions = (
  base: SerializableSmartEdgeOptions,
  override: SerializableSmartEdgeOptions,
): SerializableSmartEdgeOptions => ({
  gridRatio: override.gridRatio ?? base.gridRatio,
  nodePadding: override.nodePadding ?? base.nodePadding,
  borderRadius: override.borderRadius ?? base.borderRadius,
  avoidAreas: override.avoidAreas ?? base.avoidAreas,
});

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

const buildEdgeInputs = (
  edges: Edge[],
  nodeLookup: Map<string, InternalNodeLike>,
  defaults: SmartEdgeBatchOptions,
): BatchEdgeInput[] => {
  const { preset: defaultPreset, ...defaultOptions } = defaults;
  const inputs: BatchEdgeInput[] = [];

  for (const edge of edges) {
    const endpoints = getEdgeEndpointsFromStore(nodeLookup, edge);
    if (!endpoints) continue;

    const override = readEdgeOverride(edge.data);
    inputs.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceX: endpoints.sourceX,
      sourceY: endpoints.sourceY,
      targetX: endpoints.targetX,
      targetY: endpoints.targetY,
      sourcePosition: endpoints.sourcePosition,
      targetPosition: endpoints.targetPosition,
      preset: override.preset ?? defaultPreset ?? DEFAULT_PRESET,
      options: mergeOptions(defaultOptions, override.options ?? {}),
    });
  }

  return inputs;
};

const nodeSignature = (node: Node) => [
  node.id,
  node.position.x,
  node.position.y,
  node.measured?.width,
  node.measured?.height,
  node.parentId,
];

/**
 * Owns one inlined routing Web Worker plus a per-edge results store, routes all
 * edges off the main thread whenever the graph or options change, and exposes
 * the results to `useSmartEdgeRoute`. Falls back to synchronous main-thread
 * routing when Web Workers are unavailable (e.g. SSR). Must be rendered inside
 * React Flow context so it can read edge endpoints from the store.
 */
export function SmartEdgeBatchRoutingProvider({
  nodes,
  edges,
  options,
  children,
}: Readonly<SmartEdgeBatchRoutingProviderProps>) {
  const store = useMemo(() => createRoutingStore(), []);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const inputRef = useRef<BatchRoutingInput>({ nodes: [], edges: [] });

  const nodeLookup = useStore((state) => state.nodeLookup);

  const defaults = useMemo<SmartEdgeBatchOptions>(
    () => options ?? {},
    [options],
  );

  const routingNodes = useMemo(() => toRoutingNodes(nodes), [nodes]);

  const edgeInputs = useMemo(
    () => buildEdgeInputs(edges, nodeLookup, defaults),
    [edges, nodeLookup, defaults],
  );

  const signature = useMemo(
    () =>
      JSON.stringify({
        nodes: routingNodes.map(nodeSignature),
        edges: edgeInputs,
      }),
    [routingNodes, edgeInputs],
  );

  const dispatch = useCallback(() => {
    const requestId = (requestIdRef.current += 1);
    const worker = workerRef.current;
    const input = inputRef.current;

    if (worker) {
      const request: RoutingRequest = { ...input, requestId };
      worker.postMessage(request);
    } else {
      store.setResults(routeSmartEdgesBatch(input));
    }
  }, [store]);

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
      store.setResults(routeSmartEdgesBatch(inputRef.current));
    };
    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [store]);

  // Keep the latest input in a ref (updated in an effect, never during render)
  // so the signature-gated dispatch effect can read it without re-running on
  // every render when consumers pass inline props.
  useEffect(() => {
    inputRef.current = { nodes: routingNodes, edges: edgeInputs };
  }, [routingNodes, edgeInputs]);

  useEffect(() => {
    dispatch();
  }, [signature, dispatch]);

  return <RoutingStoreContext value={store}>{children}</RoutingStoreContext>;
}
