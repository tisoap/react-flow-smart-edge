import { handleBatchRequest } from "./workerProtocol";
import type { SmartEdgeBatchRequest } from "./routeBatch";

// Minimal worker bootstrap. All routing logic lives in `handleBatchRequest`
// (unit tested on the main thread); this file only wires the worker's
// message channel, so it is excluded from coverage.
addEventListener("message", (event: MessageEvent<SmartEdgeBatchRequest>) => {
  postMessage(handleBatchRequest(event.data));
});
