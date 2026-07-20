import { describe, expect, it, vi } from "vitest";
import { createSmartEdgeStore } from "./providerStore";
import type { SmartEdgeRouteResult } from "./providerStore";

const routedResult = (svgPathString: string): SmartEdgeRouteResult => ({
  kind: "routed",
  wasRouted: true,
  svgPathString,
  edgeCenterX: 0,
  edgeCenterY: 0,
  points: [],
});

const clearResult: SmartEdgeRouteResult = { kind: "clear", wasRouted: false };

describe("createSmartEdgeStore edge routes", () => {
  it("returns undefined for an edge that has never been routed", () => {
    const store = createSmartEdgeStore();

    expect(store.getRoute("missing")).toBeUndefined();
  });

  it("stores and returns a route by edge id", () => {
    const store = createSmartEdgeStore();
    const result = routedResult("M0,0 L1,1");

    store.mergeRoutes({ alpha: result });

    expect(store.getRoute("alpha")).toBe(result);
  });

  it("notifies only the listener of the edge whose value reference changed", () => {
    const store = createSmartEdgeStore();
    const alphaListener = vi.fn();
    const betaListener = vi.fn();
    store.subscribeEdge("alpha", alphaListener);
    store.subscribeEdge("beta", betaListener);

    store.mergeRoutes({ alpha: routedResult("M0,0 L1,1") });

    expect(alphaListener).toHaveBeenCalledTimes(1);
    expect(betaListener).not.toHaveBeenCalled();
  });

  it("does not notify when the patched value is the same reference already stored", () => {
    const store = createSmartEdgeStore();
    const listener = vi.fn();
    const result = routedResult("M0,0 L1,1");
    store.mergeRoutes({ alpha: result });
    store.subscribeEdge("alpha", listener);

    store.mergeRoutes({ alpha: result });

    expect(listener).not.toHaveBeenCalled();
    expect(store.getRoute("alpha")).toBe(result);
  });

  it("notifies when the patched value is a new reference, even with equal contents", () => {
    const store = createSmartEdgeStore();
    const listener = vi.fn();
    store.mergeRoutes({ alpha: clearResult });
    store.subscribeEdge("alpha", listener);

    store.mergeRoutes({ alpha: { kind: "clear", wasRouted: false } });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("merging a patch for an id with no subscribers is a no-op that does not throw", () => {
    const store = createSmartEdgeStore();

    expect(() => {
      store.mergeRoutes({ unheard: routedResult("M0,0 L1,1") });
    }).not.toThrow();
    expect(store.getRoute("unheard")).toEqual(routedResult("M0,0 L1,1"));
  });

  it("removeRoutes notifies removed ids and clears their stored route", () => {
    const store = createSmartEdgeStore();
    const alphaListener = vi.fn();
    const betaListener = vi.fn();
    store.subscribeEdge("alpha", alphaListener);
    store.subscribeEdge("beta", betaListener);
    store.mergeRoutes({
      alpha: routedResult("M0,0 L1,1"),
      beta: routedResult("M2,2 L3,3"),
    });
    alphaListener.mockClear();
    betaListener.mockClear();

    store.removeRoutes(["alpha"]);

    expect(alphaListener).toHaveBeenCalledTimes(1);
    expect(betaListener).not.toHaveBeenCalled();
    expect(store.getRoute("alpha")).toBeUndefined();
    expect(store.getRoute("beta")).toBe(store.getRoute("beta"));
  });

  it("removing an id with no subscribers is a no-op that does not throw", () => {
    const store = createSmartEdgeStore();

    expect(() => {
      store.removeRoutes(["unheard"]);
    }).not.toThrow();
  });

  it("notifies subscribeAllRoutes when a merge actually changes a route", () => {
    const store = createSmartEdgeStore();
    const listener = vi.fn();
    store.subscribeAllRoutes(listener);

    store.mergeRoutes({ alpha: routedResult("M0,0 L1,1") });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getRoutesVersion()).toBe(1);
  });

  it("does not notify subscribeAllRoutes on a no-op merge", () => {
    const store = createSmartEdgeStore();
    const result = routedResult("M0,0 L1,1");
    store.mergeRoutes({ alpha: result });
    const versionBefore = store.getRoutesVersion();
    const listener = vi.fn();
    store.subscribeAllRoutes(listener);

    store.mergeRoutes({ alpha: result });

    expect(listener).not.toHaveBeenCalled();
    expect(store.getRoutesVersion()).toBe(versionBefore);
  });

  it("notifies subscribeAllRoutes once for a multi-id merge", () => {
    const store = createSmartEdgeStore();
    const listener = vi.fn();
    store.subscribeAllRoutes(listener);

    store.mergeRoutes({
      alpha: routedResult("M0,0 L1,1"),
      beta: routedResult("M2,2 L3,3"),
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getRoutesVersion()).toBe(1);
  });

  it("notifies subscribeAllRoutes when removeRoutes actually removes a route", () => {
    const store = createSmartEdgeStore();
    store.mergeRoutes({ alpha: routedResult("M0,0 L1,1") });
    const versionBefore = store.getRoutesVersion();
    const listener = vi.fn();
    store.subscribeAllRoutes(listener);

    store.removeRoutes(["alpha"]);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getRoutesVersion()).toBe(versionBefore + 1);
  });

  it("does not notify subscribeAllRoutes when removeRoutes removes nothing", () => {
    const store = createSmartEdgeStore();
    const listener = vi.fn();
    store.subscribeAllRoutes(listener);

    store.removeRoutes(["unheard"]);

    expect(listener).not.toHaveBeenCalled();
    expect(store.getRoutesVersion()).toBe(0);
  });

  it("stops notifying subscribeAllRoutes after unsubscribe", () => {
    const store = createSmartEdgeStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeAllRoutes(listener);

    unsubscribe();
    store.mergeRoutes({ alpha: routedResult("M0,0 L1,1") });

    expect(listener).not.toHaveBeenCalled();
  });

  it("starts with a routes version of 0", () => {
    const store = createSmartEdgeStore();

    expect(store.getRoutesVersion()).toBe(0);
  });

  it("stops notifying after unsubscribe", () => {
    const store = createSmartEdgeStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeEdge("alpha", listener);

    unsubscribe();
    store.mergeRoutes({ alpha: routedResult("M0,0 L1,1") });

    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps notifying a remaining listener after another listener on the same edge unsubscribes", () => {
    const store = createSmartEdgeStore();
    const firstListener = vi.fn();
    const secondListener = vi.fn();
    const unsubscribeFirst = store.subscribeEdge("alpha", firstListener);
    store.subscribeEdge("alpha", secondListener);

    unsubscribeFirst();
    store.mergeRoutes({ alpha: routedResult("M0,0 L1,1") });

    expect(firstListener).not.toHaveBeenCalled();
    expect(secondListener).toHaveBeenCalledTimes(1);
  });

  it("re-subscribing after the last listener unsubscribed still receives notifications", () => {
    const store = createSmartEdgeStore();
    const firstListener = vi.fn();
    const unsubscribe = store.subscribeEdge("alpha", firstListener);
    unsubscribe();

    const secondListener = vi.fn();
    store.subscribeEdge("alpha", secondListener);
    store.mergeRoutes({ alpha: routedResult("M0,0 L1,1") });

    expect(secondListener).toHaveBeenCalledTimes(1);
  });
});

describe("createSmartEdgeStore node state", () => {
  it("starts with empty dragging and selected sets", () => {
    const store = createSmartEdgeStore();

    expect(store.getDraggingNodeIds()).toEqual(new Set());
    expect(store.getSelectedNodeIds()).toEqual(new Set());
  });

  it("does not notify or swap references when new sets have the same contents as the current ones", () => {
    const store = createSmartEdgeStore();
    const listener = vi.fn();
    store.subscribeNodeState(listener);
    const draggingBefore = store.getDraggingNodeIds();
    const selectedBefore = store.getSelectedNodeIds();

    store.setNodeState(new Set(), new Set());

    expect(listener).not.toHaveBeenCalled();
    expect(store.getDraggingNodeIds()).toBe(draggingBefore);
    expect(store.getSelectedNodeIds()).toBe(selectedBefore);
  });

  it("notifies and swaps the dragging reference when its size differs", () => {
    const store = createSmartEdgeStore();
    const listener = vi.fn();
    store.subscribeNodeState(listener);

    store.setNodeState(new Set(["node-1"]), new Set());

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getDraggingNodeIds()).toEqual(new Set(["node-1"]));
  });

  it("notifies and swaps the dragging reference when same size but different elements", () => {
    const store = createSmartEdgeStore();
    store.setNodeState(new Set(["node-1"]), new Set());
    const listener = vi.fn();
    store.subscribeNodeState(listener);

    store.setNodeState(new Set(["node-2"]), new Set());

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getDraggingNodeIds()).toEqual(new Set(["node-2"]));
  });

  it("keeps the dragging reference stable when a new set has equal contents", () => {
    const store = createSmartEdgeStore();
    store.setNodeState(new Set(["node-1"]), new Set());
    const draggingBefore = store.getDraggingNodeIds();
    const listener = vi.fn();
    store.subscribeNodeState(listener);

    store.setNodeState(new Set(["node-1"]), new Set());

    expect(listener).not.toHaveBeenCalled();
    expect(store.getDraggingNodeIds()).toBe(draggingBefore);
  });

  it("notifies and swaps the selected reference independently of dragging", () => {
    const store = createSmartEdgeStore();
    const listener = vi.fn();
    store.subscribeNodeState(listener);
    const draggingBefore = store.getDraggingNodeIds();

    store.setNodeState(new Set(), new Set(["node-9"]));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSelectedNodeIds()).toEqual(new Set(["node-9"]));
    expect(store.getDraggingNodeIds()).toBe(draggingBefore);
  });

  it("stops notifying node-state listeners after unsubscribe", () => {
    const store = createSmartEdgeStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeNodeState(listener);

    unsubscribe();
    store.setNodeState(new Set(["node-1"]), new Set());

    expect(listener).not.toHaveBeenCalled();
  });
});
