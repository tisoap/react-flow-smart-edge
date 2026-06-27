import { isSmartEdgePreset } from "./routingRegistry";
import type {
  BatchEdgeInput,
  SerializableSmartEdgeOptions,
  SmartEdgeBatchOptions,
  SmartEdgeBatchOverride,
} from "./routeSmartEdgesBatch";
import type { Position, Rect } from "@xyflow/react";

const DEFAULT_PRESET = "bezier" as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isRect = (value: unknown): value is Rect => {
  if (!isRecord(value)) return false;
  return (
    typeof value["x"] === "number" &&
    typeof value["y"] === "number" &&
    typeof value["width"] === "number" &&
    typeof value["height"] === "number"
  );
};

const readNumber = (
  record: Record<string, unknown>,
  key: string,
): number | undefined => {
  const value = record[key];
  return typeof value === "number" ? value : undefined;
};

/** Reads the serializable routing options from an arbitrary `data.options`. */
const readSerializableOptions = (
  value: unknown,
): SerializableSmartEdgeOptions => {
  if (!isRecord(value)) return {};
  const avoidAreas = value["avoidAreas"];
  return {
    gridRatio: readNumber(value, "gridRatio"),
    nodePadding: readNumber(value, "nodePadding"),
    borderRadius: readNumber(value, "borderRadius"),
    avoidAreas: Array.isArray(avoidAreas)
      ? avoidAreas.filter(isRect)
      : undefined,
  };
};

/** Reads `{ preset, options }` from an edge's `data.smartEdge`, tolerating junk. */
export const readEdgeOverride = (data: unknown): SmartEdgeBatchOverride => {
  if (!isRecord(data) || !isRecord(data["smartEdge"])) return {};
  const smartEdge = data["smartEdge"];
  const preset = smartEdge["preset"];
  return {
    preset: isSmartEdgePreset(preset) ? preset : undefined,
    options: readSerializableOptions(smartEdge["options"]),
  };
};

/** Merges default options with an edge override, ignoring undefined overrides. */
const mergeOptions = (
  base: SerializableSmartEdgeOptions,
  override: SerializableSmartEdgeOptions,
): SerializableSmartEdgeOptions => ({
  gridRatio: override.gridRatio ?? base.gridRatio,
  nodePadding: override.nodePadding ?? base.nodePadding,
  borderRadius: override.borderRadius ?? base.borderRadius,
  avoidAreas: override.avoidAreas ?? base.avoidAreas,
});

/** The edge geometry an edge component reports for routing. */
export interface EdgeRouteInput {
  id: string;
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data?: unknown;
}

/**
 * Builds the serializable {@link BatchEdgeInput} for one edge from its React
 * Flow geometry, the provider defaults, and any `edge.data.smartEdge` override.
 */
export const buildEdgeInput = (
  edge: EdgeRouteInput,
  defaults: SmartEdgeBatchOptions,
): BatchEdgeInput => {
  const { preset: defaultPreset, ...defaultOptions } = defaults;
  const override = readEdgeOverride(edge.data);

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceX: edge.sourceX,
    sourceY: edge.sourceY,
    targetX: edge.targetX,
    targetY: edge.targetY,
    sourcePosition: edge.sourcePosition,
    targetPosition: edge.targetPosition,
    preset: override.preset ?? defaultPreset ?? DEFAULT_PRESET,
    options: mergeOptions(defaultOptions, override.options ?? {}),
  };
};
