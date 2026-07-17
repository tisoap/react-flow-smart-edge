import { describe, expect, it } from "vitest";
import { createMinHeap } from "./binaryHeap";

describe("binaryHeap", () => {
  it("pops ids in ascending score order", () => {
    const heap = createMinHeap();
    heap.push(10, 5);
    heap.push(20, 1);
    heap.push(30, 3);
    expect(heap.pop()).toBe(20);
    expect(heap.pop()).toBe(30);
    expect(heap.pop()).toBe(10);
  });

  it("returns -1 when empty", () => {
    const heap = createMinHeap();
    expect(heap.pop()).toBe(-1);
    heap.push(1, 1);
    heap.pop();
    expect(heap.pop()).toBe(-1);
  });

  it("supports duplicate ids (lazy decrease-key)", () => {
    const heap = createMinHeap();
    heap.push(7, 10);
    heap.push(7, 2); // better score pushed as duplicate
    expect(heap.pop()).toBe(7);
    expect(heap.size).toBe(1); // stale duplicate still queued
    expect(heap.pop()).toBe(7);
  });

  it("tracks size", () => {
    const heap = createMinHeap();
    expect(heap.size).toBe(0);
    heap.push(1, 1);
    heap.push(2, 2);
    expect(heap.size).toBe(2);
  });

  it("handles interleaved push/pop keeping heap order", () => {
    const heap = createMinHeap();
    const scores = [9, 4, 7, 1, 8, 2, 6, 3, 5, 0];
    // eslint-disable-next-line id-length -- id is a standard identifier for a node/item id
    scores.forEach((score, id) => {
      heap.push(id, score);
    });
    heap.push(100, -1);
    expect(heap.pop()).toBe(100);
    const out: number[] = [];
    // eslint-disable-next-line @typescript-eslint/prefer-for-of, id-length -- simple count iteration with standard counter
    for (let i = 0; i < scores.length; i++) {
      out.push(heap.pop());
    }
    // eslint-disable-next-line id-length -- id is a standard identifier for a node/item id
    const popped = out.map((id) => scores[id]);
    // eslint-disable-next-line id-length -- a,b are standard comparison parameter names
    expect(popped).toEqual([...popped].sort((a, b) => a - b));
  });
});
