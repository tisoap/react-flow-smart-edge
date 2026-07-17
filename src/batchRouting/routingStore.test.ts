import { describe, expect, it, vi } from "vitest";
import { createRoutingStore } from "./routingStore";
import type { GetSmartEdgeReturn } from "../getSmartEdge";

const result: GetSmartEdgeReturn = {
  svgPathString: "M0,0",
  edgeCenterX: 0,
  edgeCenterY: 0,
  points: [],
  wasRouted: true,
};

describe("createRoutingStore", () => {
  it("notifies subscribers and exposes results by id", () => {
    const store = createRoutingStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    expect(store.getResult("e1")).toBeUndefined();

    store.setResults({ e1: result });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getResult("e1")).toBe(result);

    unsubscribe();
    store.setResults({});
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getResult("e1")).toBeUndefined();
  });
});
