import {
  svgDrawSmoothLinePath,
  svgDrawStraightLinePath,
  svgDrawSmoothStepLinePath,
  svgDrawSimpleBezierLinePath,
  pathfindingAStarDiagonal,
  pathfindingJumpPointNoDiagonal,
} from "../functions";
import type { DrawEdgeFunction, PathFindingFunction } from "../functions";
import type { SmartEdgePreset } from "../smartEdgePresets";

/** The pure routing functions a preset resolves to (no React fallback). */
export interface PresetRouting {
  drawEdge: DrawEdgeFunction;
  generatePath: PathFindingFunction;
}

/** All preset names the worker can route. Kept in sync with `SmartEdgePreset`. */
export const SMART_EDGE_PRESETS = [
  "bezier",
  "straight",
  "step",
  "smoothstep",
  "simplebezier",
] as const satisfies readonly SmartEdgePreset[];

/** Type guard for a valid preset name coming from untrusted edge `data`. */
export const isSmartEdgePreset = (value: unknown): value is SmartEdgePreset =>
  SMART_EDGE_PRESETS.some((preset) => preset === value);

/**
 * Resolve a preset name to its `drawEdge`/`generatePath` functions, mirroring
 * `smartEdgePresets` but without the React fallback components. This keeps the
 * Web Worker bundle free of `@xyflow/react`/React, which cannot run off the
 * main thread. Kept in sync with `src/smartEdgePresets.ts`.
 */
export const resolvePresetRouting = (
  preset: SmartEdgePreset,
  borderRadius?: number,
): PresetRouting => {
  switch (preset) {
    case "bezier":
      return {
        drawEdge: svgDrawSmoothLinePath,
        generatePath: pathfindingAStarDiagonal,
      };
    case "straight":
      return {
        drawEdge: svgDrawStraightLinePath,
        generatePath: pathfindingAStarDiagonal,
      };
    case "step":
      return {
        drawEdge: svgDrawStraightLinePath,
        generatePath: pathfindingJumpPointNoDiagonal,
      };
    case "smoothstep":
      return {
        drawEdge: svgDrawSmoothStepLinePath({ borderRadius }),
        generatePath: pathfindingJumpPointNoDiagonal,
      };
    case "simplebezier":
      return {
        drawEdge: svgDrawSimpleBezierLinePath,
        generatePath: pathfindingAStarDiagonal,
      };
  }
};
