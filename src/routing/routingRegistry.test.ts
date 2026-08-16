import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import {
  resolvePresetRouting,
  isSmartEdgePreset,
  SMART_EDGE_PRESETS,
} from "./routingRegistry";

describe("resolvePresetRouting", () => {
  it("resolves draw and pathfinding functions for every preset", () => {
    for (const preset of SMART_EDGE_PRESETS) {
      const { drawEdge, generatePath } = resolvePresetRouting(preset);
      expect(typeof drawEdge).toBe("function");
      expect(typeof generatePath).toBe("function");
    }
  });

  it("applies the border radius to the smoothstep drawer", () => {
    const { drawEdge } = resolvePresetRouting("smoothstep", 12);
    const path = drawEdge(
      { x: 0, y: 0, position: Position.Right },
      { x: 100, y: 100, position: Position.Left },
      [[0, 50]],
    );
    expect(path).toContain("Q");
  });
});

describe("isSmartEdgePreset", () => {
  it("accepts known preset names", () => {
    expect(isSmartEdgePreset("bezier")).toBe(true);
    expect(isSmartEdgePreset("smoothstep")).toBe(true);
  });

  it("rejects unknown or non-string values", () => {
    expect(isSmartEdgePreset("nope")).toBe(false);
    expect(isSmartEdgePreset(123)).toBe(false);
    expect(isSmartEdgePreset(undefined)).toBe(false);
  });
});
