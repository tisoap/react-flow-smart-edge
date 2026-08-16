import { handleBatchRequest, isSmartEdgeBatchRequest } from "./workerProtocol";

// Minimal worker bootstrap. All routing logic lives in `handleBatchRequest`
// (unit tested on the main thread); this file only wires the worker's
// message channel, so it is excluded from coverage. Ignore non-batch
// messages (webpack HMR pings) so they never reach `toNodeMap`.
addEventListener("message", (event: MessageEvent<unknown>) => {
  if (!isSmartEdgeBatchRequest(event.data)) return;
  postMessage(handleBatchRequest(event.data));
});
