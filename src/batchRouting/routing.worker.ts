import { handleRoutingRequest } from "./workerMessages";
import type { RoutingRequest } from "./workerMessages";

// Minimal worker bootstrap. All routing logic lives in `handleRoutingRequest`
// (unit tested on the main thread); this file only wires the worker's message
// channel, so it is excluded from coverage.
addEventListener("message", (event: MessageEvent<RoutingRequest>) => {
  postMessage(handleRoutingRequest(event.data));
});
