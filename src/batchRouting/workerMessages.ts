import { routeSmartEdgesBatch } from "./routeSmartEdgesBatch";
import type {
  BatchRoutingInput,
  BatchRoutingResults,
} from "./routeSmartEdgesBatch";

/**
 * A routing batch sent to the worker, tagged with a monotonically increasing
 * `requestId` so the main thread can ignore responses for superseded requests.
 */
export interface RoutingRequest extends BatchRoutingInput {
  requestId: number;
}

/** The worker's reply, echoing the originating `requestId`. */
export interface RoutingResponse {
  requestId: number;
  results: BatchRoutingResults;
}

/**
 * Pure request/response mapping run inside the worker. Kept separate from the
 * worker bootstrap so it can be unit tested on the main thread.
 */
export const handleRoutingRequest = (
  request: RoutingRequest,
): RoutingResponse => ({
  requestId: request.requestId,
  results: routeSmartEdgesBatch({ nodes: request.nodes, edges: request.edges }),
});
