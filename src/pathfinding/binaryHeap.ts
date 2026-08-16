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

  const swap = (indexA: number, indexB: number): void => {
    const itemId = ids[indexA];
    ids[indexA] = ids[indexB];
    ids[indexB] = itemId;
    const score = scores[indexA];
    scores[indexA] = scores[indexB];
    scores[indexB] = score;
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
    push: (itemId, score) => {
      ids.push(itemId);
      scores.push(score);
      siftUp(ids.length - 1);
    },
    pop: () => {
      if (ids.length === 0) return -1;
      const top = ids[0];
      const lastItemId = ids[ids.length - 1];
      const lastItemScore = scores[ids.length - 1];
      ids.length -= 1;
      scores.length -= 1;
      if (ids.length > 0) {
        ids[0] = lastItemId;
        scores[0] = lastItemScore;
        siftDown(0);
      }
      return top;
    },
    get size() {
      return ids.length;
    },
  };
};
