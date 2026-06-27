import {
  buildObstacleMatrix,
  getBoundingBoxes,
  type GraphBoundingBox,
  type NodeBoundingBox,
} from "../functions";
import type { Node, Rect, XYPosition } from "@xyflow/react";

/**
 * The endpoint-independent part of the routing pipeline for a given set of
 * nodes and options. Every edge in the same render that shares these inputs can
 * reuse this instead of recomputing the node bounding boxes and re-marking the
 * obstacle grid. The mutable per-edge grid is still built fresh from
 * `obstacleMatrix`, so pathfinding side effects stay isolated per edge.
 */
export interface SharedGrid {
  graphBox: GraphBoundingBox;
  /** Node and avoid-area boxes combined, in the order `createGrid` expects. */
  obstacleBoxes: NodeBoundingBox[];
  /** `mapRows x mapColumns` grid where `1` marks a blocked cell. */
  obstacleMatrix: number[][];
  /**
   * Bounds of the obstacle boxes before the graph box adds its own padding.
   * Used to decide whether an edge's endpoints would have expanded the graph
   * box; if they fall inside these bounds the shared grid applies unchanged.
   */
  rawXMin: number;
  rawXMax: number;
  rawYMin: number;
  rawYMax: number;
}

/** Bounded number of distinct shared grids kept alive at once. */
const MAX_ENTRIES = 8;

const cache = new Map<string, SharedGrid>();

/** Test-only counter of how many times the shared grid was actually built. */
let buildCount = 0;

const signatureOf = (
  nodes: Node[],
  nodePadding: number,
  gridRatio: number,
  avoidAreas: Rect[],
): string => {
  const nodePart = nodes
    .map((node) =>
      [
        node.id,
        node.position.x,
        node.position.y,
        node.measured?.width ?? 0,
        node.measured?.height ?? 0,
      ].join(","),
    )
    .join("|");

  const avoidPart = avoidAreas
    .map((area) => [area.x, area.y, area.width, area.height].join(","))
    .join("|");

  return [
    nodePart,
    `pad=${String(nodePadding)}`,
    `ratio=${String(gridRatio)}`,
    `avoid=${avoidPart}`,
  ].join(";");
};

const rawBoundsOf = (boxes: NodeBoundingBox[]) => ({
  rawXMin: Math.min(...boxes.map((box) => box.topLeft.x)),
  rawYMin: Math.min(...boxes.map((box) => box.topLeft.y)),
  rawXMax: Math.max(...boxes.map((box) => box.bottomRight.x)),
  rawYMax: Math.max(...boxes.map((box) => box.bottomRight.y)),
});

const buildSharedGrid = (
  nodes: Node[],
  nodePadding: number,
  gridRatio: number,
  avoidAreas: Rect[],
): SharedGrid => {
  buildCount += 1;

  const { graphBox, nodeBoxes, avoidBoxes } = getBoundingBoxes(
    nodes,
    nodePadding,
    gridRatio,
    avoidAreas,
  );

  const obstacleBoxes = [...nodeBoxes, ...avoidBoxes];
  const obstacleMatrix = buildObstacleMatrix(
    graphBox,
    obstacleBoxes,
    gridRatio,
  );
  const { rawXMin, rawYMin, rawXMax, rawYMax } = rawBoundsOf(obstacleBoxes);

  return {
    graphBox,
    obstacleBoxes,
    obstacleMatrix,
    rawXMin,
    rawYMin,
    rawXMax,
    rawYMax,
  };
};

/**
 * Return the shared, endpoint-independent grid data for these nodes and
 * options, building and caching it on first use. Returns `null` when there are
 * no obstacles at all (no nodes and no avoid areas), in which case the caller
 * should route directly from the edge endpoints.
 */
export const getSharedGrid = (
  nodes: Node[],
  nodePadding: number,
  gridRatio: number,
  avoidAreas: Rect[],
): SharedGrid | null => {
  if (nodes.length === 0 && avoidAreas.length === 0) {
    return null;
  }

  const signature = signatureOf(nodes, nodePadding, gridRatio, avoidAreas);
  const cached = cache.get(signature);
  if (cached) {
    return cached;
  }

  const built = buildSharedGrid(nodes, nodePadding, gridRatio, avoidAreas);

  // Bounded cache: once full, drop everything rather than tracking per-entry
  // recency. Within a single render the same few signatures repeat, so this
  // keeps memory bounded without churn in the common case.
  if (cache.size >= MAX_ENTRIES) {
    cache.clear();
  }
  cache.set(signature, built);

  return built;
};

/**
 * Whether every given point falls inside the shared grid's pre-padding bounds.
 * When true, the edge's endpoints would not have expanded the graph box, so the
 * shared `graphBox` and `obstacleMatrix` apply to this edge unchanged.
 */
export const isWithinSharedBounds = (
  shared: SharedGrid,
  points: XYPosition[],
): boolean => {
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);

  return (
    Math.min(...xValues) >= shared.rawXMin &&
    Math.max(...xValues) <= shared.rawXMax &&
    Math.min(...yValues) >= shared.rawYMin &&
    Math.max(...yValues) <= shared.rawYMax
  );
};

/** Test-only: clear the cache and reset the build counter. */
export const __resetSharedGridCache = (): void => {
  cache.clear();
  buildCount = 0;
};

/** Test-only: number of times the shared grid was built since the last reset. */
export const __getSharedGridBuildCount = (): number => buildCount;
