/**
 * Reusable search buffers shared by the flat A* and JPS finders. Buffers are
 * module-level and grown on demand; a per-search `generation` stamp in `mark`
 * makes stale data invisible without clearing, so repeated searches allocate
 * nothing.
 */
export interface SearchScratch {
  /** Cost from start (valid when `mark[i] === generation`). */
  g: Float64Array;
  /** Parent cell index, `-1` for the start (valid when marked). */
  parent: Int32Array;
  /** 0 = untouched, STATE_OPEN, STATE_CLOSED (valid when marked). */
  state: Uint8Array;
  /** Generation stamp per cell. */
  mark: Int32Array;
  generation: number;
}

export const STATE_OPEN = 1;
export const STATE_CLOSED = 2;

let buffers: SearchScratch = {
  g: new Float64Array(0),
  parent: new Int32Array(0),
  state: new Uint8Array(0),
  mark: new Int32Array(0),
  generation: 0,
};

export const acquireScratch = (size: number): SearchScratch => {
  if (buffers.g.length < size) {
    buffers = {
      g: new Float64Array(size),
      parent: new Int32Array(size),
      state: new Uint8Array(size),
      // New Int32Array is zero-filled; starting generation at 1 keeps every
      // cell "unmarked" without an explicit fill.
      mark: new Int32Array(size),
      generation: buffers.generation,
    };
  }
  buffers.generation += 1;
  return buffers;
};

/** Lazily initializes a cell for the current generation. */
export const touch = (scratch: SearchScratch, index: number): void => {
  if (scratch.mark[index] === scratch.generation) return;
  scratch.mark[index] = scratch.generation;
  scratch.g[index] = Number.POSITIVE_INFINITY;
  scratch.parent[index] = -1;
  scratch.state[index] = 0;
};

/** Walks `parent` links from the end index back to the start. */
export const reconstructPath = (
  scratch: SearchScratch,
  endIndex: number,
  width: number,
): number[][] => {
  const path: number[][] = [];
  let index = endIndex;
  while (index !== -1) {
    path.push([index % width, Math.floor(index / width)]);
    index = scratch.parent[index];
  }
  return path.reverse();
};
