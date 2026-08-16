import { useCallback, useContext, useSyncExternalStore } from "react";
import { SmartEdgeRoutingContext } from "../routing/routingContext";
import { nativeStepPolyline } from "../routing/obstacleIndex";
import {
  computeEdgeHops,
  drawOrthogonalHopPath,
  toPolyline,
} from "../functions";
import type { RegisteredSmartEdge } from "../routing/scheduler";
import type { SmartEdgeRouteResult } from "../routing/providerStore";
import type { SmartEdgePreset } from "../smartEdgePresets";
import type { XYPosition } from "@xyflow/react";

const isStepLikePreset = (preset: SmartEdgePreset): boolean =>
  preset === "step" || preset === "smoothstep";

/** Drops duplicate and collinear vertices so a straight native step run is
 * one segment. Needed for hop detection: `nativeStepPolyline` splits at the
 * unused-axis midpoint, which is often exactly where two edges cross. */
const simplifyPolyline = (points: XYPosition[]): XYPosition[] => {
  const last = points[points.length - 1];
  const interior = points.slice(1, -1).map((point) => [point.x, point.y]);
  return toPolyline(points[0], last, interior);
};

const nativeStepAsPolyline = (
  source: XYPosition,
  target: XYPosition,
  registration: RegisteredSmartEdge,
): XYPosition[] =>
  simplifyPolyline(
    nativeStepPolyline(
      source.x,
      source.y,
      registration.sourcePosition,
      target.x,
      target.y,
      registration.targetPosition,
    ),
  );

/**
 * Configuration for circuit-style "hops": small bridge arcs drawn where a
 * smart edge crosses another orthogonal smart edge rendered beneath it.
 */
export interface HopOptions {
  /** Radius of the bridge arc drawn at each crossing. Default `6`. */
  radius?: number;
  /**
   * Corner rounding radius applied to the whole edge while hops are active.
   * `0` (default) keeps sharp step corners; a positive value gives a
   * smooth-step look. For smooth-step edges set this to match your border
   * radius (React Flow's default is `5`).
   */
  borderRadius?: number;
  /** Axis-alignment / crossing tolerance in pixels. Default `0.5`. */
  epsilon?: number;
}

/** The `hops` value as accepted on options: a flag, a config object, or unset. */
export type HopSetting = boolean | HopOptions | undefined;

interface ResolvedHopConfig {
  radius: number;
  borderRadius: number;
  epsilon: number;
}

const DEFAULT_HOP_CONFIG: ResolvedHopConfig = {
  radius: 6,
  borderRadius: 0,
  epsilon: 0.5,
};

const resolveHopConfig = (hops: HopSetting): ResolvedHopConfig => {
  if (!hops || hops === true) return DEFAULT_HOP_CONFIG;
  return {
    radius: hops.radius ?? DEFAULT_HOP_CONFIG.radius,
    borderRadius: hops.borderRadius ?? DEFAULT_HOP_CONFIG.borderRadius,
    epsilon: hops.epsilon ?? DEFAULT_HOP_CONFIG.epsilon,
  };
};

export interface ComputeHoppedPathParams {
  /** This edge's own routed polyline, already resolved from its published
   * route (see `resolveOwnPolyline`). */
  ownPolyline: XYPosition[];
  /** The polylines of every same-preset edge painted underneath this one
   * that currently has a resolvable route. */
  underneathPolylines: XYPosition[][];
  /** The hop configuration (`true` for defaults, or an object to tune). */
  hops: HopSetting;
}

/**
 * Draws this edge's SVG path with circuit-style hops: a small bridge arc at
 * every crossing between `ownPolyline` and one of `underneathPolylines`.
 * Pure geometry — every polyline is already resolved from published routes
 * by the caller, so this does no pathfinding and no store reads.
 */
export const computeHoppedPath = (params: ComputeHoppedPathParams): string => {
  const config = resolveHopConfig(params.hops);
  const hops = computeEdgeHops(
    params.ownPolyline,
    params.underneathPolylines,
    config.epsilon,
  );

  return drawOrthogonalHopPath(params.ownPolyline, hops, {
    hopRadius: config.radius,
    borderRadius: config.borderRadius,
  });
};

/**
 * Resolves this edge's own rendered polyline from its published route.
 * Routed edges walk their pathfinding points; clear step/smooth-step edges
 * use the native Z/L skeleton so hops still draw when
 * `routeOnlyWhenBlocked` skipped A*. Returns `null` while the route is
 * pending, or for a clear non-step preset (those keep the native fallback
 * with no hop drawing).
 */
const resolveOwnPolyline = (
  source: XYPosition,
  target: XYPosition,
  registration: RegisteredSmartEdge,
  route: SmartEdgeRouteResult | undefined,
): XYPosition[] | null => {
  if (route?.kind === "routed") {
    return toPolyline(source, target, route.points);
  }
  if (route?.kind === "clear" && isStepLikePreset(registration.preset)) {
    return nativeStepAsPolyline(source, target, registration);
  }
  return null;
};

/**
 * Resolves one underneath registration's rendered polyline from its
 * published route: a routed edge walks its actual path points, a clear edge
 * falls back to the native step skeleton between its registered endpoints
 * (still enough geometry to detect a crossing). Returns `null` when that
 * edge has no published route yet, in which case it contributes no
 * crossing rather than a stale one.
 */
const resolveUnderneathPolyline = (
  registration: RegisteredSmartEdge,
  route: SmartEdgeRouteResult | undefined,
): XYPosition[] | null => {
  /* v8 ignore next -- pending underneath edge; covered by unit tests */
  if (route === undefined) return null;

  const source: XYPosition = {
    x: registration.sourceX,
    y: registration.sourceY,
  };
  const target: XYPosition = {
    x: registration.targetX,
    y: registration.targetY,
  };

  if (route.kind === "routed") return toPolyline(source, target, route.points);

  return nativeStepAsPolyline(source, target, registration);
};

/** Every same-preset registration painted strictly underneath `ownOrder`,
 * resolved to a polyline via `getRoute` and filtered down to the ones with a
 * resolvable route. */
const collectUnderneathPolylines = (
  registrations: RegisteredSmartEdge[],
  ownOrder: number,
  ownPreset: SmartEdgePreset,
  getRoute: (edgeId: string) => SmartEdgeRouteResult | undefined,
): XYPosition[][] => {
  const isPolyline = (
    polyline: XYPosition[] | null,
  ): polyline is XYPosition[] => polyline !== null;

  return registrations
    .filter(
      (registration) =>
        registration.order < ownOrder && registration.preset === ownPreset,
    )
    .map((registration) =>
      resolveUnderneathPolyline(registration, getRoute(registration.id)),
    )
    .filter(isPolyline);
};

/** No provider, hops disabled, or nothing to watch: never notifies. */
const inertUnsubscribe = (): void => {
  // Nothing to unsubscribe from.
};

/* v8 ignore next 3 -- useSyncExternalStore server snapshot; unused in browser */
const getInertRoutesVersion = (): number => 0;

export interface UseHoppedPathParams {
  edgeId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  /** The hop configuration (`true` for defaults, or an object to tune). */
  hops: HopSetting;
  /** Editable/checkpoint edges use a different draw pipeline and skip hops. */
  editable?: boolean;
  checkpoints?: boolean;
}

/**
 * Returns the hopped SVG path for this edge, or `null` when hops are
 * disabled, there is no provider, this edge's own route is not yet
 * published, a clear non-step edge has nothing to bridge, or its
 * registration cannot be found. Clear step/smooth-step edges still get a
 * path (the native skeleton, with hops if they cross a neighbor).
 *
 * Reads only already-published routes from the provider's store —
 * `getRegistrationsInOrder`/`getRoute` are imperative getters, so a
 * `subscribeAllRoutes` subscription (via `useSyncExternalStore`, keyed off a
 * version counter) drives re-renders whenever any edge's route changes, own
 * or a neighbor's. This makes hop cost pure geometry over cached polylines
 * instead of a per-edge re-route.
 */
export const useHoppedPath = (params: UseHoppedPathParams): string | null => {
  const context = useContext(SmartEdgeRoutingContext);
  const hopsRequested =
    Boolean(params.hops) && !params.editable && !params.checkpoints;
  const store = hopsRequested && context !== null ? context.store : undefined;

  const subscribe = useCallback(
    (listener: () => void): (() => void) => {
      if (!store) return inertUnsubscribe;
      return store.subscribeAllRoutes(listener);
    },
    [store],
  );
  const getSnapshot = useCallback(
    () => store?.getRoutesVersion() ?? 0,
    [store],
  );

  useSyncExternalStore(subscribe, getSnapshot, getInertRoutesVersion);

  if (!hopsRequested || context === null) return null;

  const registrations = context.getRegistrationsInOrder();
  const ownRegistration = registrations.find(
    (registration) => registration.id === params.edgeId,
  );
  /* v8 ignore next -- registration race during unmount; covered by unit tests */
  if (!ownRegistration) return null;

  const source: XYPosition = { x: params.sourceX, y: params.sourceY };
  const target: XYPosition = { x: params.targetX, y: params.targetY };

  const ownPolyline = resolveOwnPolyline(
    source,
    target,
    ownRegistration,
    context.store.getRoute(params.edgeId),
  );
  if (!ownPolyline) return null;

  const underneathPolylines = collectUnderneathPolylines(
    registrations,
    ownRegistration.order,
    ownRegistration.preset,
    (edgeId) => context.store.getRoute(edgeId),
  );

  return computeHoppedPath({
    ownPolyline,
    underneathPolylines,
    hops: params.hops,
  });
};
