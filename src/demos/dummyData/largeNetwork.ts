import type { Edge, Node } from "@xyflow/react";

/** Result of {@link buildLargeNetwork}: a station graph sized for perf
 * stories. */
export interface LargeNetworkGraph {
  nodes: Node[];
  edges: Edge[];
}

const STATION_GAP_X = 220;
const STATION_GAP_Y = 160;
/** Fraction of a grid cell a station may drift from its regular grid slot,
 * so the layout reads like a scattered train map (issue #69) rather than a
 * perfect lattice. */
const JITTER_RATIO = 0.35;
/** Share of edges drawn between grid-adjacent stations; the remainder are
 * long-range connections between arbitrary stations. */
const SHORT_RANGE_SHARE = 0.7;
const EDGES_PER_NODE = 1.5;
/** Bounds how long the long-range pass searches for a fresh (unused) pair
 * before giving up, so small graphs (where most pairs are already wired)
 * cannot loop indefinitely. */
const LONG_RANGE_ATTEMPT_FACTOR = 20;

/**
 * Deterministic pseudo-random sequence (Park–Miller "minimal standard" LCG).
 * The same seed always yields the same sequence of values in `[0, 1)`, which
 * is what makes {@link buildLargeNetwork} reproducible for a given
 * `(nodeCount, seed)` pair.
 */
const createRandomSequence = (seed: number): (() => number) => {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

/** Fisher–Yates shuffle driven by the given deterministic random sequence,
 * so the result only depends on `items` and `nextRandom`'s seed. */
const shuffleWith = <Item>(items: Item[], nextRandom: () => number): Item[] => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextRandom() * (index + 1));
    const current = shuffled[index];
    const swapped = shuffled[swapIndex];
    shuffled[index] = swapped;
    shuffled[swapIndex] = current;
  }
  return shuffled;
};

const pairKey = (firstIndex: number, secondIndex: number): string =>
  firstIndex < secondIndex
    ? `${String(firstIndex)}-${String(secondIndex)}`
    : `${String(secondIndex)}-${String(firstIndex)}`;

interface StationLayout {
  columns: number;
  rows: number;
}

const layoutFor = (nodeCount: number): StationLayout => {
  const columns = Math.max(1, Math.ceil(Math.sqrt(nodeCount)));
  const rows = Math.max(1, Math.ceil(nodeCount / columns));
  return { columns, rows };
};

const buildStationNodes = (
  nodeCount: number,
  layout: StationLayout,
  nextRandom: () => number,
): Node[] => {
  const nodes: Node[] = [];
  for (let stationIndex = 0; stationIndex < nodeCount; stationIndex += 1) {
    const row = Math.floor(stationIndex / layout.columns);
    const col = stationIndex % layout.columns;
    const jitterX = (nextRandom() - 0.5) * JITTER_RATIO * STATION_GAP_X;
    const jitterY = (nextRandom() - 0.5) * JITTER_RATIO * STATION_GAP_Y;

    nodes.push({
      id: `station-${String(stationIndex)}`,
      data: { label: `Station ${String(stationIndex)}` },
      position: {
        x: col * STATION_GAP_X + jitterX,
        y: row * STATION_GAP_Y + jitterY,
      },
    });
  }
  return nodes;
};

/** Every grid-adjacent (right/below) station pair, as candidate short-range
 * connections. */
const neighborCandidates = (
  nodeCount: number,
  layout: StationLayout,
): [number, number][] => {
  const candidates: [number, number][] = [];
  for (let stationIndex = 0; stationIndex < nodeCount; stationIndex += 1) {
    const row = Math.floor(stationIndex / layout.columns);
    const col = stationIndex % layout.columns;

    const rightIndex = stationIndex + 1;
    if (col + 1 < layout.columns && rightIndex < nodeCount) {
      candidates.push([stationIndex, rightIndex]);
    }

    const belowIndex = stationIndex + layout.columns;
    if (row + 1 < layout.rows && belowIndex < nodeCount) {
      candidates.push([stationIndex, belowIndex]);
    }
  }
  return candidates;
};

const buildStationEdges = (
  nodeCount: number,
  layout: StationLayout,
  edgeType: string,
  nextRandom: () => number,
): Edge[] => {
  const totalTarget = Math.round(nodeCount * EDGES_PER_NODE);
  const shortRangeTarget = Math.round(totalTarget * SHORT_RANGE_SHARE);
  const longRangeTarget = totalTarget - shortRangeTarget;

  const usedPairs = new Set<string>();
  const pairs: [number, number][] = [];

  const shuffledNeighbors = shuffleWith(
    neighborCandidates(nodeCount, layout),
    nextRandom,
  );
  // `neighborCandidates` never yields the same pair twice (each grid edge is
  // generated from exactly one of its two endpoints), so no membership check
  // is needed here — only to record pairs for the long-range pass below,
  // which must avoid re-wiring an already-connected short-range pair.
  for (const candidate of shuffledNeighbors) {
    if (pairs.length >= shortRangeTarget) break;
    const [fromIndex, toIndex] = candidate;
    usedPairs.add(pairKey(fromIndex, toIndex));
    pairs.push(candidate);
  }

  const maxAttempts = longRangeTarget * LONG_RANGE_ATTEMPT_FACTOR;
  let longRangeFound = 0;
  let attempts = 0;
  while (
    longRangeFound < longRangeTarget &&
    attempts < maxAttempts &&
    nodeCount > 1
  ) {
    attempts += 1;
    const fromIndex = Math.floor(nextRandom() * nodeCount);
    const toIndex = Math.floor(nextRandom() * nodeCount);
    const key = pairKey(fromIndex, toIndex);
    const isNewPair = fromIndex !== toIndex && !usedPairs.has(key);
    if (isNewPair) {
      usedPairs.add(key);
      pairs.push([fromIndex, toIndex]);
      longRangeFound += 1;
    }
  }

  return pairs.map(([fromIndex, toIndex]) => ({
    id: `line-${String(fromIndex)}-${String(toIndex)}`,
    source: `station-${String(fromIndex)}`,
    target: `station-${String(toIndex)}`,
    type: edgeType,
  }));
};

/**
 * Builds a deterministic, #69-style "train network" graph: grid-scattered
 * station nodes (default React Flow node type; sizes come from runtime
 * measurement, not this fixture) wired with roughly 1.5 edges per node, a
 * mix of short-range (grid-neighbor) and long-range connections, all using
 * `edgeType`.
 *
 * Deterministic: the same `(nodeCount, seed)` always produces the same
 * nodes and edges, driven entirely by a seeded LCG (no `Math.random`, no
 * wall-clock input).
 */
export const buildLargeNetwork = (
  nodeCount: number,
  seed = 1,
  edgeType = "smartBezier",
): LargeNetworkGraph => {
  const nextRandom = createRandomSequence(seed);
  const layout = layoutFor(nodeCount);
  const nodes = buildStationNodes(nodeCount, layout, nextRandom);
  const edges = buildStationEdges(nodeCount, layout, edgeType, nextRandom);
  return { nodes, edges };
};
