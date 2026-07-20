import {
  buildObstacleBoxes,
  isPolylineBlocked,
  nativeStepPolyline,
  rectIntersectsBox,
} from "./obstacleIndex";
import { routeCacheKey } from "./routeCache";
import { CORRIDOR_MARGIN_CELLS } from "./corridor";
import { diffNodeSnapshots, corridorTouchesRects } from "./invalidation";
import type { RouteCache } from "./routeCache";
import type { ObstacleBox } from "./obstacleIndex";
import type { SmartEdgeRouteResult } from "./providerStore";
import type {
  SchedulerDeps,
  SchedulerState,
  RegisteredSmartEdge,
  ResolvedProviderOptions,
  SmartEdgeMetrics,
} from "./scheduler";
import type { XYPosition } from "@xyflow/react";

/** Axis-aligned rect in graph coordinates — an `ObstacleBox` without the id
 * it doesn't need here. */
type EdgeRect = Omit<ObstacleBox, "id">;

/** A cached route plus enough to detect a cache-key hash collision: the raw
 * obstacle signature (before hashing) the key's hash was built from. */
export interface CachedRoute {
  result: SmartEdgeRouteResult;
  obstaclesSignature: string;
  corridor: EdgeRect;
}

type SchedulerCounts = Pick<
  SmartEdgeMetrics,
  "routed" | "cacheHits" | "clear" | "deferred" | "unchanged"
>;

/** Everything one flush's per-edge decisions need that stays constant across
 * the whole flush, bundled so helpers take one argument instead of several. */
interface FlushContext {
  draggingNodeIds: ReadonlySet<string>;
  changedRects: EdgeRect[];
  forcedEdgeIds: ReadonlySet<string>;
  obstacleBoxes: ObstacleBox[];
  optionsKey: string;
  options: ResolvedProviderOptions;
  cache: RouteCache<CachedRoute>;
  signatures: Map<string, string>;
}

interface FlushAccumulators {
  nextDeferredIds: Set<string>;
  dispatchItems: RegisteredSmartEdge[];
  routeMerges: Record<string, SmartEdgeRouteResult>;
  counts: SchedulerCounts;
}

const STEP_LIKE_PRESETS = new Set(["step", "smoothstep"]);

/** The subset of an edge's registration that determines its route. Distinct
 * from `routeCacheKey`'s (rounded, obstacle-hashed) key: this is an exact
 * comparison used only to detect "nothing changed since last processed". */
const edgeSignature = (edge: RegisteredSmartEdge): string =>
  JSON.stringify({
    sourceX: edge.sourceX,
    sourceY: edge.sourceY,
    targetX: edge.targetX,
    targetY: edge.targetY,
    sourcePosition: edge.sourcePosition,
    targetPosition: edge.targetPosition,
    preset: edge.preset,
    options: edge.options,
    waypoints: edge.waypoints,
  });

/** The endpoint bounding box inflated by the first (narrowest) corridor
 * rung's margin — a conservative invalidation region: a wider search that
 * later succeeds on a bigger rung is still safely invalidated because the
 * wider corridor contains this one. */
const buildEdgeCorridor = (
  edge: RegisteredSmartEdge,
  gridRatio: number,
): EdgeRect => {
  const inflate = CORRIDOR_MARGIN_CELLS[0] * gridRatio;

  return {
    xMin: Math.min(edge.sourceX, edge.targetX) - inflate,
    yMin: Math.min(edge.sourceY, edge.targetY) - inflate,
    xMax: Math.max(edge.sourceX, edge.targetX) + inflate,
    yMax: Math.max(edge.sourceY, edge.targetY) + inflate,
  };
};

/** Raw obstacle signature (before hashing) for a corridor's obstacle list,
 * kept alongside the hashed cache key so a hash collision on the key can
 * still be caught by comparing this full string on a hit. */
const obstaclesSignatureOf = (boxes: ObstacleBox[]): string =>
  boxes
    .map((box) => [box.id, box.xMin, box.yMin, box.xMax, box.yMax].join(","))
    .join("|");

const buildCacheKeyInfo = (
  edge: RegisteredSmartEdge,
  context: FlushContext,
) => {
  const corridor = buildEdgeCorridor(edge, context.options.gridRatio);
  const corridorObstacles = context.obstacleBoxes.filter((box) =>
    rectIntersectsBox(
      corridor.xMin,
      corridor.yMin,
      corridor.xMax,
      corridor.yMax,
      box,
    ),
  );

  return {
    key: routeCacheKey(edge, context.optionsKey, corridorObstacles),
    corridor,
    corridorObstacles,
  };
};

/** A cache hit only counts if the raw obstacle list it was built from still
 * matches — guards against the (extremely rare) djb2 hash collision the key
 * itself can't detect on its own. */
const findCacheHit = (
  edge: RegisteredSmartEdge,
  context: FlushContext,
): CachedRoute | undefined => {
  const { key, corridorObstacles } = buildCacheKeyInfo(edge, context);
  const cached = context.cache.get(key);
  if (cached === undefined) return undefined;

  return cached.obstaclesSignature === obstaclesSignatureOf(corridorObstacles)
    ? cached
    : undefined;
};

/** Whether either endpoint of `edge` is currently being dragged. */
const isEdgeDragging = (
  edge: RegisteredSmartEdge,
  draggingNodeIds: ReadonlySet<string>,
): boolean =>
  draggingNodeIds.has(edge.source) || draggingNodeIds.has(edge.target);

/** Whether `edge` can skip this flush entirely: not forced past this check
 * (e.g. by a just-ended drag), its registration signature is exactly what it
 * was last time it was processed, and no changed rect this flush touches its
 * routing corridor. */
const isEdgeUnchanged = (
  edgeId: string,
  currentSignature: string,
  corridor: EdgeRect,
  context: FlushContext,
): boolean =>
  !context.forcedEdgeIds.has(edgeId) &&
  context.signatures.get(edgeId) === currentSignature &&
  !corridorTouchesRects(corridor, context.changedRects);

/** The polyline this edge would render natively (no smart routing): a
 * straight segment for bezier/straight/simplebezier presets, the Z/L step
 * skeleton for step/smoothstep. Used only to answer "is it already clear?" */
const nativePolylineFor = (edge: RegisteredSmartEdge): XYPosition[] =>
  STEP_LIKE_PRESETS.has(edge.preset)
    ? nativeStepPolyline(
        edge.sourceX,
        edge.sourceY,
        edge.sourcePosition,
        edge.targetX,
        edge.targetY,
        edge.targetPosition,
      )
    : [
        { x: edge.sourceX, y: edge.sourceY },
        { x: edge.targetX, y: edge.targetY },
      ];

/** Decides and folds one edge's fate into the flush's running totals, in the
 * fixed priority order: deferred (still dragging) → unchanged (nothing
 * relevant moved, and not forced past this check) → cache hit → clear
 * (unblocked and only routed when blocked) → dispatch. Every outcome except
 * `deferred` and `unchanged` updates the edge's last-processed signature;
 * leaving it stale while deferred is what lets a drag-end force a real
 * re-decision even though the edge's own registration never changed while
 * it was being skipped. */
const processEdge = (
  edge: RegisteredSmartEdge,
  context: FlushContext,
  accumulators: FlushAccumulators,
): void => {
  if (
    isEdgeDragging(edge, context.draggingNodeIds) &&
    !context.options.routeWhileDragging
  ) {
    accumulators.counts.deferred += 1;
    accumulators.nextDeferredIds.add(edge.id);
    return;
  }

  const currentSignature = edgeSignature(edge);
  const corridor = buildEdgeCorridor(edge, context.options.gridRatio);
  if (isEdgeUnchanged(edge.id, currentSignature, corridor, context)) {
    accumulators.counts.unchanged += 1;
    return;
  }

  context.signatures.set(edge.id, currentSignature);

  const cachedRoute = findCacheHit(edge, context);
  if (cachedRoute) {
    accumulators.counts.cacheHits += 1;
    accumulators.routeMerges[edge.id] = cachedRoute.result;
    return;
  }

  if (context.options.routeOnlyWhenBlocked) {
    const excludeIds = new Set([edge.source, edge.target]);
    if (
      !isPolylineBlocked(
        nativePolylineFor(edge),
        context.obstacleBoxes,
        excludeIds,
      )
    ) {
      accumulators.counts.clear += 1;
      accumulators.routeMerges[edge.id] = { kind: "clear", wasRouted: false };
      return;
    }
  }

  accumulators.counts.routed += 1;
  accumulators.dispatchItems.push(edge);
};

const buildFlushContext = (
  deps: SchedulerDeps,
  state: SchedulerState,
): FlushContext => {
  const diff = diffNodeSnapshots(
    state.flushedSnapshot,
    state.snapshot,
    deps.options.nodePadding,
  );
  const draggingActive = diff.draggingNodeIds.size > 0;
  const dragJustEnded = state.draggingWasActive && !draggingActive;
  state.draggingWasActive = draggingActive;

  return {
    draggingNodeIds: diff.draggingNodeIds,
    changedRects: diff.changedRects,
    forcedEdgeIds: dragJustEnded ? state.deferredEdgeIds : new Set<string>(),
    obstacleBoxes: buildObstacleBoxes(
      state.absoluteNodes,
      deps.options.nodePadding,
      deps.options.avoidAreas,
    ),
    optionsKey: JSON.stringify({
      nodePadding: deps.options.nodePadding,
      gridRatio: deps.options.gridRatio,
      avoidAreas: deps.options.avoidAreas,
    }),
    options: deps.options,
    cache: state.cache,
    signatures: state.signatures,
  };
};

const emitMetrics = (
  deps: SchedulerDeps,
  batchId: number,
  executedOn: "worker" | "main",
  batchLatencyMs: number,
  counts: SchedulerCounts,
): void => {
  deps.onMetrics?.({ batchId, executedOn, batchLatencyMs, ...counts });
};

const dispatchAndMerge = async (
  deps: SchedulerDeps,
  state: SchedulerState,
  context: FlushContext,
  accumulators: FlushAccumulators,
  batchId: number,
): Promise<void> => {
  if (Object.keys(accumulators.routeMerges).length > 0) {
    deps.store.mergeRoutes(accumulators.routeMerges);
  }

  if (accumulators.dispatchItems.length === 0) {
    emitMetrics(deps, batchId, "main", 0, accumulators.counts);
    return;
  }

  const outcome = await deps.dispatch(
    state.rawNodes,
    accumulators.dispatchItems,
  );
  if (state.disposed || batchId !== state.batchId) return;

  const dispatchMerges: Record<string, SmartEdgeRouteResult> = {};
  Object.entries(outcome.results).forEach(([edgeId, result]) => {
    dispatchMerges[edgeId] = result;
    const dispatchedEdge = state.edges.get(edgeId);
    if (!dispatchedEdge) return;

    const info = buildCacheKeyInfo(dispatchedEdge, context);
    state.cache.set(info.key, {
      result,
      obstaclesSignature: obstaclesSignatureOf(info.corridorObstacles),
      corridor: info.corridor,
    });
  });

  if (Object.keys(dispatchMerges).length > 0) {
    deps.store.mergeRoutes(dispatchMerges);
  }

  emitMetrics(
    deps,
    batchId,
    outcome.executedOn,
    outcome.durationMs,
    accumulators.counts,
  );
};

/** Runs one flush to completion: decides every registered edge's fate,
 * merges cache/clear results into the store immediately, then (if anything
 * needs it) dispatches the remainder and merges/caches the response — unless
 * a later flush has already superseded this one's `batchId` by the time the
 * response arrives. */
export const runFlush = async (
  deps: SchedulerDeps,
  state: SchedulerState,
): Promise<void> => {
  if (state.disposed) return;

  const context = buildFlushContext(deps, state);
  const accumulators: FlushAccumulators = {
    nextDeferredIds: new Set(),
    dispatchItems: [],
    routeMerges: {},
    counts: { routed: 0, cacheHits: 0, clear: 0, deferred: 0, unchanged: 0 },
  };
  state.edges.forEach((edge) => {
    processEdge(edge, context, accumulators);
  });

  state.deferredEdgeIds = accumulators.nextDeferredIds;
  state.flushedSnapshot = state.snapshot;
  state.batchId += 1;

  await dispatchAndMerge(deps, state, context, accumulators, state.batchId);
};
