import { BezierEdge, StraightEdge, StepEdge } from "@xyflow/react";
import {
  svgDrawSmoothLinePath,
  svgDrawStraightLinePath,
  pathfindingAStarDiagonal,
  pathfindingJumpPointNoDiagonal,
} from "./functions";
import type { SmartEdgeOptions } from "./SmartEdge";

export const smartEdgePresets = {
  bezier: {
    drawEdge: svgDrawSmoothLinePath,
    generatePath: pathfindingAStarDiagonal,
    fallback: BezierEdge,
  },
  straight: {
    drawEdge: svgDrawStraightLinePath,
    generatePath: pathfindingAStarDiagonal,
    fallback: StraightEdge,
  },
  step: {
    drawEdge: svgDrawStraightLinePath,
    generatePath: pathfindingJumpPointNoDiagonal,
    fallback: StepEdge,
  },
} as const satisfies Record<string, SmartEdgeOptions>;

export type SmartEdgePreset = keyof typeof smartEdgePresets;
