/**
 * Array-backed binary min-heap of integer ids scored by numbers. Used as the
 * A-star/JPS open list. Decrease-key is handled lazily: callers push a duplicate
 * entry with the better score and skip stale pops via their closed check.
 */
export interface MinHeap {
  push(id: number, score: number): void;
  /** The id with the lowest score, or `-1` when empty. */
  pop(): number;
  readonly size: number;
}

export const createMinHeap = (): MinHeap => {
  const ids: number[] = [];
  const scores: number[] = [];

  // eslint-disable-next-line id-length -- a,b are standard array index parameter names
  const swap = (a: number, b: number): void => {
    // eslint-disable-next-line id-length -- id is a standard identifier for a node/item id
    const id = ids[a];
    ids[a] = ids[b];
    ids[b] = id;
    const score = scores[a];
    scores[a] = scores[b];
    scores[b] = score;
  };

  const siftUp = (start: number): void => {
    let index = start;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (scores[parent] <= scores[index]) break;
      swap(parent, index);
      index = parent;
    }
  };

  const siftDown = (start: number): void => {
    let index = start;
    for (;;) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;
      if (left < ids.length && scores[left] < scores[smallest]) smallest = left;
      if (right < ids.length && scores[right] < scores[smallest])
        smallest = right;
      if (smallest === index) break;
      swap(smallest, index);
      index = smallest;
    }
  };

  return {
    // eslint-disable-next-line id-length -- id is a standard identifier for a node/item id
    push: (id, score) => {
      ids.push(id);
      scores.push(score);
      siftUp(ids.length - 1);
    },
    pop: () => {
      if (ids.length === 0) return -1;
      const top = ids[0];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- pop() is safe since length > 0 was checked
      const lastId = ids.pop()!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- pop() is safe since length > 0 was checked
      const lastScore = scores.pop()!;
      if (ids.length > 0) {
        ids[0] = lastId;
        scores[0] = lastScore;
        siftDown(0);
      }
      return top;
    },
    get size() {
      return ids.length;
    },
  };
};
