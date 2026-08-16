import { routeSmartEdgeBatch } from "./routeBatch";
import type {
  SmartEdgeBatchRequest,
  SmartEdgeBatchResponse,
} from "./routeBatch";

/**
 * True when `data` is a routing batch we can run. Webpack's HMR runtime
 * posts its own messages (`{ type: "webpackOk" }`, etc.) into every worker;
 * those have no `nodes` array, and treating them as batches throws inside
 * `toNodeMap`.
 */
export const isSmartEdgeBatchRequest = (
  data: unknown,
): data is SmartEdgeBatchRequest => {
  if (typeof data !== "object" || data === null) return false;
  if (!("requestId" in data) || !("nodes" in data) || !("edges" in data)) {
    return false;
  }

  return (
    typeof data.requestId === "number" &&
    Array.isArray(data.nodes) &&
    Array.isArray(data.edges)
  );
};

/**
 * Pure request/response mapping run inside the routing Web Worker. Kept
 * separate from the worker bootstrap so it can be unit tested on the main
 * thread. Uses `Date.now()` rather than `performance.now()` for `durationMs`
 * since the High Resolution Time API is not guaranteed to be available in
 * every worker runtime this library targets.
 */
export const handleBatchRequest = (
  request: SmartEdgeBatchRequest,
): SmartEdgeBatchResponse => {
  const startedAt = Date.now();
  const results = routeSmartEdgeBatch(request.nodes, request.edges);

  return {
    requestId: request.requestId,
    results,
    durationMs: Date.now() - startedAt,
  };
};
