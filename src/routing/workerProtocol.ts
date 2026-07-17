import { routeSmartEdgeBatch } from "./routeBatch";
import type {
  SmartEdgeBatchRequest,
  SmartEdgeBatchResponse,
} from "./routeBatch";

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
