import { handleBatchRequest } from "./workerProtocol";
import type {
  SmartEdgeBatchItem,
  SmartEdgeBatchRequest,
  SmartEdgeBatchResponse,
} from "./routeBatch";
import type { SmartEdgeRouteResult } from "./providerStore";
import type { Node } from "@xyflow/react";

/** What one dispatch resolves with: the routed results plus where and how
 * long routing took, forwarded to the scheduler's `onMetrics`. */
export interface DispatchOutcome {
  results: Record<string, SmartEdgeRouteResult>;
  executedOn: "worker" | "main";
  durationMs: number;
}

/**
 * Runs one batch synchronously on the calling thread: used both when no
 * `Worker` is available and as the fallback after a worker construction or
 * runtime error. Reuses `handleBatchRequest` — the same pure routing core the
 * worker itself runs — so main-thread and worker routing can never diverge.
 */
export const dispatchOnMainThread = (
  nodes: Node[],
  edges: SmartEdgeBatchItem[],
): DispatchOutcome => {
  const response = handleBatchRequest({ requestId: 0, nodes, edges });

  return {
    results: response.results,
    executedOn: "main",
    durationMs: response.durationMs,
  };
};

/** The minimal `Worker` surface this module needs, small enough to fake in
 * tests without depending on the DOM's `Worker` global. A real `Worker`
 * instance satisfies this structurally. */
export interface WorkerLike {
  postMessage: (request: SmartEdgeBatchRequest) => void;
  terminate: () => void;
  onmessage: ((event: MessageEvent<SmartEdgeBatchResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

/** One in-flight worker request: its own dispatch arguments (needed to
 * replay it on the main thread if the worker dies before responding) plus
 * the resolver for the promise `dispatch` handed back to its caller. */
interface PendingRequest {
  nodes: Node[];
  edges: SmartEdgeBatchItem[];
  resolve: (outcome: DispatchOutcome) => void;
}

export interface WorkerDispatcher {
  /** Posts one batch to the worker and resolves once its matching response
   * arrives — or immediately on the main thread, once the worker has
   * errored. */
  dispatch: (
    nodes: Node[],
    edges: SmartEdgeBatchItem[],
  ) => Promise<DispatchOutcome>;
}

/**
 * Wraps a live `Worker` instance with request/response id matching. Once the
 * worker reports an error, every currently pending request is immediately
 * resolved on the main thread (so no caller is ever left hanging), the
 * worker is terminated, and every subsequent `dispatch` call also runs on
 * the main thread for the rest of this dispatcher's life.
 */
export const createWorkerDispatcher = (
  worker: WorkerLike,
): WorkerDispatcher => {
  const pending = new Map<number, PendingRequest>();
  let nextRequestId = 0;
  let broken = false;

  worker.onmessage = (event) => {
    const request = pending.get(event.data.requestId);
    if (!request) return;

    pending.delete(event.data.requestId);
    request.resolve({
      results: event.data.results,
      executedOn: "worker",
      durationMs: event.data.durationMs,
    });
  };

  worker.onerror = () => {
    broken = true;
    worker.terminate();
    pending.forEach((request) => {
      request.resolve(dispatchOnMainThread(request.nodes, request.edges));
    });
    pending.clear();
  };

  return {
    dispatch: (nodes, edges) => {
      if (broken) return Promise.resolve(dispatchOnMainThread(nodes, edges));

      const requestId = (nextRequestId += 1);
      return new Promise<DispatchOutcome>((resolve) => {
        pending.set(requestId, { nodes, edges, resolve });
        worker.postMessage({ requestId, nodes, edges });
      });
    },
  };
};
