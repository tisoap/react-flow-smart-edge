import type { XYPosition } from "@xyflow/react";
import type { ControlPointData } from "./ControlPoint";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasStringField = (
  record: Record<string, unknown>,
  field: string,
): boolean => field in record && typeof record[field] === "string";

const hasNumberField = (
  record: Record<string, unknown>,
  field: string,
): boolean => field in record && typeof record[field] === "number";

const isControlPointData = (value: unknown): value is ControlPointData =>
  isRecord(value) &&
  hasStringField(value, "id") &&
  hasNumberField(value, "x") &&
  hasNumberField(value, "y");

const isControlPointArray = (value: unknown): value is ControlPointData[] =>
  Array.isArray(value) && value.every(isControlPointData);

const isXYPosition = (value: unknown): value is XYPosition =>
  isRecord(value) && hasNumberField(value, "x") && hasNumberField(value, "y");

/**
 * Reads the active waypoints from an edge's `data`, tolerating any data shape
 * (returns an empty list when absent or malformed).
 */
export const readControlPoints = (data: unknown): ControlPointData[] => {
  if (
    isRecord(data) &&
    "points" in data &&
    isControlPointArray(data["points"])
  ) {
    return data["points"];
  }
  return [];
};

/**
 * Reads fixed checkpoints from an edge's `data`, tolerating any data shape
 * (returns an empty list when absent or malformed).
 */
export const readCheckpoints = (data: unknown): XYPosition[] => {
  if (
    isRecord(data) &&
    "checkpoints" in data &&
    Array.isArray(data["checkpoints"])
  ) {
    return data["checkpoints"].filter(isXYPosition);
  }
  return [];
};
