import { createContext } from "react";
import type { CSSProperties } from "react";
import type { Node } from "@xyflow/react";
import type { SmartEdgePreset } from "../smartEdgePresets";
import type { SmartEdgeStore } from "./providerStore";
import type {
  RegisteredSmartEdge,
  ResolvedProviderOptions as SchedulerOptions,
} from "./scheduler";

/**
 * Every option a `SmartEdgeProvider` resolves from its props: the scheduler's
 * routing-decision fields (inherited from `SchedulerOptions`, declared once in
 * `scheduler.ts`) plus the presentation fields the provider itself owns
 * (preset, corner radius, drag placeholder style). Extending rather than
 * redeclaring the shared fields keeps them in exactly one place while this
 * type still satisfies `SchedulerDeps["options"]` structurally, with no cast.
 */
export interface ResolvedProviderOptions extends SchedulerOptions {
  preset: SmartEdgePreset;
  /** Corner radius for the `smoothstep` preset. */
  borderRadius?: number;
  /** Extra style merged onto a smart edge's native path while the route is
   * pending or an endpoint is being dragged. Drag uses a
   * `react-flow__edge animated` wrapper; pending uses a static dash. */
  dragFallbackStyle: CSSProperties;
}

/** Provider-facing options: every field of `ResolvedProviderOptions` is
 * optional, defaulted by `resolveProviderOptions`. */
export type SmartEdgeProviderOptions = Partial<ResolvedProviderOptions>;

/** What `SmartEdgeProvider` exposes to descendants through React context. */
export interface SmartEdgeContextValue {
  store: SmartEdgeStore;
  /** An immutable snapshot of the resolved provider options. The provider
   * mutates its live options object in place (the scheduler closes over
   * that reference) and publishes a fresh snapshot on every applied change,
   * so the identity of this object tracks option value changes exactly. */
  options: ResolvedProviderOptions;
  /** Registers one edge's routing geometry, assigning it the next
   * registration order. Returns an unregister function. */
  registerEdge: (edge: Omit<RegisteredSmartEdge, "order">) => () => void;
  /** Every currently registered edge, in registration (paint) order — used
   * to place hop arcs where edges cross (a later task). */
  getRegistrationsInOrder: () => RegisteredSmartEdge[];
  /** The latest `nodes` prop, resolved to absolute (subflow-aware)
   * coordinates — used by floating edges (a later task). */
  getNodesSnapshot: () => Node[];
}

/**
 * Holds the active `SmartEdgeProvider` context. `null` when no provider is
 * mounted, in which case consumers should render their non-smart fallback.
 */
export const SmartEdgeRoutingContext =
  createContext<SmartEdgeContextValue | null>(null);

const DEFAULT_DRAG_FALLBACK_STYLE: CSSProperties = {};

/** Applies every `ResolvedProviderOptions` default to a provider's (partial)
 * `options` prop. */
export const resolveProviderOptions = (
  options: SmartEdgeProviderOptions = {},
): ResolvedProviderOptions => ({
  preset: options.preset ?? "bezier",
  gridRatio: options.gridRatio ?? 10,
  nodePadding: options.nodePadding ?? 10,
  avoidAreas: options.avoidAreas ?? [],
  borderRadius: options.borderRadius,
  routeOnlyWhenBlocked: options.routeOnlyWhenBlocked ?? true,
  routeWhileDragging: options.routeWhileDragging ?? false,
  dragFallbackStyle: options.dragFallbackStyle ?? DEFAULT_DRAG_FALLBACK_STYLE,
  debounceMs: options.debounceMs ?? 16,
  cacheSize: options.cacheSize ?? 500,
});

export interface ProviderOptionsDiff {
  any: boolean;
  routing: boolean;
}

const routingSnapshot = (options: ResolvedProviderOptions): string =>
  JSON.stringify({
    gridRatio: options.gridRatio,
    nodePadding: options.nodePadding,
    avoidAreas: options.avoidAreas,
    routeOnlyWhenBlocked: options.routeOnlyWhenBlocked,
    routeWhileDragging: options.routeWhileDragging,
    cacheSize: options.cacheSize,
    borderRadius: options.borderRadius,
    preset: options.preset,
  });

const presentationSnapshot = (options: ResolvedProviderOptions): string =>
  JSON.stringify({
    debounceMs: options.debounceMs,
    dragFallbackStyle: options.dragFallbackStyle,
  });

export const diffResolvedProviderOptions = (
  previous: ResolvedProviderOptions,
  next: ResolvedProviderOptions,
): ProviderOptionsDiff => {
  const routing = routingSnapshot(previous) !== routingSnapshot(next);
  const presentation =
    presentationSnapshot(previous) !== presentationSnapshot(next);

  return { any: routing || presentation, routing };
};
