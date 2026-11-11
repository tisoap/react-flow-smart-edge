import { nativeStepPolyline } from "./obstacleIndex";
import type { RegisteredSmartEdge } from "./scheduler";
import type { XYPosition } from "@xyflow/react";

const STEP_LIKE_PRESETS = new Set(["step", "smoothstep"]);

/** The polyline this edge would render natively (no smart routing): a
 * straight segment for bezier/straight/simplebezier presets, the Z/L step
 * skeleton for step/smoothstep. Used to answer "is it already clear?" and,
 * when it is, doubles as its actual-path corridor. */
export const nativePolylineFor = (edge: RegisteredSmartEdge): XYPosition[] =>
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
