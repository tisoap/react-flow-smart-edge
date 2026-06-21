import { MarkerType } from "@xyflow/react";
import {
  SmartBezierEdge,
  SmartStraightEdge,
  SmartStepEdge,
  SmartSmoothStepEdge,
  SmartSimpleBezierEdge,
  SmartFloatingEdge,
  SmartEditableEdge,
  SmartCheckpointEdge,
} from "../../index";
import { SmartEdgeCustomLabel } from "../CustomLabel";

export const markerEndType = MarkerType.Arrow;

export const edgeTypes = {
  smartBezier: SmartBezierEdge,
  smartStraight: SmartStraightEdge,
  smartStep: SmartStepEdge,
  smartSmoothStep: SmartSmoothStepEdge,
  smartSimpleBezier: SmartSimpleBezierEdge,
  smartFloating: SmartFloatingEdge,
  smartEditable: SmartEditableEdge,
  smartCheckpoint: SmartCheckpointEdge,
  smartBezierLabel: SmartEdgeCustomLabel,
};
