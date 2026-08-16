import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { dispatchOnMainThread, createWorkerDispatcher } from "./workerDispatch";
import type { WorkerLike } from "./workerDispatch";
import type {
  SmartEdgeBatchItem,
  SmartEdgeBatchRequest,
  SmartEdgeBatchResponse,
} from "./routeBatch";
import type { Node } from "@xyflow/react";

const nodes: Node[] = [
  {
    id: "a",
    position: { x: 0, y: 0 },
    measured: { width: 100, height: 50 },
    data: {},
  },
  {
    id: "b",
    position: { x: 300, y: 0 },
    measured: { width: 100, height: 50 },
    data: {},
  },
];

const edge = (edgeId: string): SmartEdgeBatchItem => ({
  id: edgeId,
  source: "a",
  target: "b",
  sourceX: 100,
  sourceY: 25,
  targetX: 300,
  targetY: 25,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
  preset: "bezier",
});

/** A minimal `WorkerLike` fake: records posted requests and lets tests fire
 * `onmessage`/`onerror` directly, without depending on a real `Worker`. */
class FakeWorker implements WorkerLike {
  posted: SmartEdgeBatchRequest[] = [];
  terminated = false;
  onmessage: ((event: MessageEvent<SmartEdgeBatchResponse>) => void) | null =
    null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  postMessage(request: SmartEdgeBatchRequest): void {
    this.posted.push(request);
  }

  terminate(): void {
    this.terminated = true;
  }
}

const respond = (
  worker: FakeWorker,
  response: SmartEdgeBatchResponse,
): void => {
  worker.onmessage?.(new MessageEvent("message", { data: response }));
};

describe("dispatchOnMainThread", () => {
  it("routes the batch synchronously and reports executedOn main", () => {
    const outcome = dispatchOnMainThread(nodes, [edge("e1")]);

    expect(outcome.executedOn).toBe("main");
    expect(outcome.durationMs).toBeGreaterThanOrEqual(0);
    expect(outcome.results["e1"]).toMatchObject({
      kind: "routed",
      wasRouted: true,
    });
  });
});

describe("createWorkerDispatcher", () => {
  it("posts a request and resolves once its matching response arrives", async () => {
    const worker = new FakeWorker();
    const dispatcher = createWorkerDispatcher(worker);

    const outcomePromise = dispatcher.dispatch(nodes, [edge("e1")]);
    expect(worker.posted).toHaveLength(1);
    const { requestId } = worker.posted[0];

    respond(worker, {
      requestId,
      results: { e1: { kind: "clear", wasRouted: false } },
      durationMs: 5,
    });

    await expect(outcomePromise).resolves.toEqual({
      results: { e1: { kind: "clear", wasRouted: false } },
      executedOn: "worker",
      durationMs: 5,
    });
  });

  it("ignores a response whose requestId does not match a pending request", async () => {
    const worker = new FakeWorker();
    const dispatcher = createWorkerDispatcher(worker);
    let settled = false;

    const outcomePromise = dispatcher
      .dispatch(nodes, [edge("e1")])
      .then((outcome) => {
        settled = true;
        return outcome;
      });
    const { requestId } = worker.posted[0];

    respond(worker, {
      requestId: requestId + 1,
      results: {},
      durationMs: 1,
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);

    respond(worker, { requestId, results: {}, durationMs: 1 });
    await outcomePromise;
    expect(settled).toBe(true);
  });

  it("falls back to the main thread for a pending request once the worker errors, and terminates it", async () => {
    const worker = new FakeWorker();
    const dispatcher = createWorkerDispatcher(worker);

    const pendingPromise = dispatcher.dispatch(nodes, [edge("e1")]);
    worker.onerror?.(new ErrorEvent("error"));

    const outcome = await pendingPromise;
    expect(outcome.executedOn).toBe("main");
    expect(outcome.results["e1"]).toMatchObject({ kind: "routed" });
    expect(worker.terminated).toBe(true);
  });

  it("routes every dispatch on the main thread after the worker has errored, without posting again", async () => {
    const worker = new FakeWorker();
    const dispatcher = createWorkerDispatcher(worker);

    worker.onerror?.(new ErrorEvent("error"));
    const postedBefore = worker.posted.length;

    const outcome = await dispatcher.dispatch(nodes, [edge("e2")]);

    expect(outcome.executedOn).toBe("main");
    expect(worker.posted).toHaveLength(postedBefore);
  });
});
