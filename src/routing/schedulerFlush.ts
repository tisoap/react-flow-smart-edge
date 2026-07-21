import {
  buildObstacleBoxes,
  isPolylineBlocked,
  nativeStepPolyline,
} from "./obstacleIndex";
import { routeCacheKey } from "./routeCache";
import { CORRIDOR_MARGIN_CELLS } from "./corridor";
import { diffNodeSnapshots, corridorTouchesRects } from "./invalidation";
import {
  boundsOfPolyline,
  filterObstaclesInCorridor,
  obstaclesSignatureOf,
} from "./invalidationCorridor";
import type { RouteCache } from "./routeCache";
import type { ObstacleBox } from "./obstacleIndex";
import type { EdgeRect } from "./invalidationCorridor";
import type { SmartEdgeRouteResult } from "./providerStore";
import type {
  SchedulerDeps,
  SchedulerState,
  RegisteredSmartEdge,
  ResolvedProviderOptions,
  SmartEdgeMetrics,
} from "./scheduler";
import type { XYPosition } from "@xyflow/react";

/** A cached route plus enough to detect a cache-key hash collision (the raw
 * obstacle signature the key's hash was built from) and to re-validate the
 * hit against the current graph: `corridor` is the bbox of the actual path
 * this route drew (not the fixed rung-0 guess used only to bucket the
 * cache's key — see `buildEdgeCorridor`), and `obstaclesSignature` is the
 * raw signature of the obstacles that were local to that corridor when this
 * entry was stored. */
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
  /** Each edge's actual-path invalidation corridor, mirroring `signatures`'
   * lifecycle: set whenever a route is produced (clear, cache hit, or
   * dispatch), left untouched for deferred/unchanged edges, and read by
   * `isEdgeUnchanged` instead of a freshly-guessed one. */
  pathCorridors: Map<string, EdgeRect>;
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
 * rung's margin. Kept only to bucket the route cache's key: a wider search
 * that succeeds on a bigger rung can physically traverse space well outside
 * this box, so it is deliberately NOT used as an invalidation region (see
 * `pathCorridors` / `actualPathCorridor` for the region that actually is). */
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

/** The bbox of an edge's actual rendered path (routed points or the native
 * polyline), inflated by `nodePadding` plus one grid cell — the edge's real
 * invalidation corridor. */
const actualPathCorridor = (
  points: readonly XYPosition[],
  context: FlushContext,
): EdgeRect =>
  boundsOfPolyline(
    points,
    context.options.nodePadding + context.options.gridRatio,
  );

/** Builds the route-cache key for one edge: coordinates/options plus a hash
 * of the obstacles local to the rung-0 corridor (a fast bucket only — a
 * cache-key hit is re-validated against the actual-path corridor by
 * `findCacheHit` before being trusted). */
const buildCacheKey = (
  edge: RegisteredSmartEdge,
  context: FlushContext,
): string => {
  const corridor = buildEdgeCorridor(edge, context.options.gridRatio);
  const corridorObstacles = filterObstaclesInCorridor(
    corridor,
    context.obstacleBoxes,
  );

  return routeCacheKey(edge, context.optionsKey, corridorObstacles);
};

/** A cache-key hit only counts if the obstacles local to the cached route's
 * actual-path corridor still match what it was stored with — this is what
 * catches both a (extremely rare) djb2 hash collision the key can't detect
 * on its own, and a real obstacle change in the band the path traverses
 * that the rung-0 key bucket never saw. */
const findCacheHit = (
  edge: RegisteredSmartEdge,
  context: FlushContext,
): CachedRoute | undefined => {
  const cached = context.cache.get(buildCacheKey(edge, context));
  if (cached === undefined) return undefined;

  const currentObstacles = filterObstaclesInCorridor(
    cached.corridor,
    context.obstacleBoxes,
  );
  return cached.obstaclesSignature === obstaclesSignatureOf(currentObstacles)
    ? cached
    : undefined;
};

/** Whether either endpoint of `edge` is currently being dragged. */
const isEdgeDragging = (
  edge: RegisteredSmartEdge,
  draggingNodeIds: ReadonlySet<string>,
): boolean =>
  draggingNodeIds.has(edge.source) || draggingNodeIds.has(edge.target);

/** Whether `edge` can skip this flush entirely: it has a stored actual-path
 * corridor from a previous flush (absent means it was never routed, or its
 * last result never produced one — e.g. a non-routed dispatch response —
 * either way it cannot be "unchanged"), it isn't forced past this check
 * (e.g. by a just-ended drag), its registration signature is exactly what it
 * was last time it was processed, and no changed rect this flush touches
 * that stored corridor. */
const isEdgeUnchanged = (
  edgeId: string,
  currentSignature: string,
  context: FlushContext,
): boolean => {
  const corridor = context.pathCorridors.get(edgeId);

  return (
    corridor !== undefined &&
    !context.forcedEdgeIds.has(edgeId) &&
    context.signatures.get(edgeId) === currentSignature &&
    !corridorTouchesRects(corridor, context.changedRects)
  );
};

/** The polyline this edge would render natively (no smart routing): a
 * straight segment for bezier/straight/simplebezier presets, the Z/L step
 * skeleton for step/smoothstep. Used to answer "is it already clear?" and,
 * when it is, doubles as its actual-path corridor. */
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
 * it was being skipped. Every outcome that produces a route (cache hit,
 * clear) also records its actual-path corridor for the next flush; a
 * dispatched edge's corridor is recorded later, once its route arrives (see
 * `dispatchAndMerge`). */
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
  if (isEdgeUnchanged(edge.id, currentSignature, context)) {
    accumulators.counts.unchanged += 1;
    return;
  }

  context.signatures.set(edge.id, currentSignature);

  const cachedRoute = findCacheHit(edge, context);
  if (cachedRoute) {
    accumulators.counts.cacheHits += 1;
    accumulators.routeMerges[edge.id] = cachedRoute.result;
    context.pathCorridors.set(edge.id, cachedRoute.corridor);
    return;
  }

  if (context.options.routeOnlyWhenBlocked) {
    const polyline = nativePolylineFor(edge);
    const excludeIds = new Set([edge.source, edge.target]);
    if (!isPolylineBlocked(polyline, context.obstacleBoxes, excludeIds)) {
      accumulators.counts.clear += 1;
      accumulators.routeMerges[edge.id] = { kind: "clear", wasRouted: false };
      context.pathCorridors.set(edge.id, actualPathCorridor(polyline, context));
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
    pathCorridors: state.pathCorridors,
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
    if (!dispatchedEdge || result.kind !== "routed") return;

    const corridor = actualPathCorridor(
      result.points.map(([pointX, pointY]) => ({ x: pointX, y: pointY })),
      context,
    );
    state.pathCorridors.set(edgeId, corridor);
    state.cache.set(buildCacheKey(dispatchedEdge, context), {
      result,
      corridor,
      obstaclesSignature: obstaclesSignatureOf(
        filterObstaclesInCorridor(corridor, context.obstacleBoxes),
      ),
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
