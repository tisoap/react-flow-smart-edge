import { nativeStepPolyline } from "./obstacleIndex";
import type { RegisteredSmartEdge } from "./scheduler";
import type { XYPosition } from "@xyflow/react";

const STEP_LIKE_PRESETS = new Set(["step", "smoothstep"]);

/** The polyline an edge renders before smart routing changes its path. */
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
