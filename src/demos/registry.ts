import {
  createSmartEdge,
  svgDrawSmoothStepLinePath,
  SmartFloatingConnectionLine,
} from "../index";
import {
  edgeTypes,
  nodes,
  edgesBezier,
  edgesStraight,
  edgesStep,
  edgesSmoothStep,
  edgesLabel,
  simpleNodes,
  simpleEdgesBezier,
  unalignedNodes,
  unalignedEdgesStep,
  horizontalNodes,
  horizontalEdgesStep,
  subFlowNodes,
  subFlowEdgesBezier,
  subFlowEdgesStep,
  subFlowGroupNodes,
  subFlowGroupEdgesBezier,
  subFlowGroupEdgesStep,
  floatingNodes,
  floatingEdges,
  avoidAreaNodes,
  avoidAreaEdgesBezier,
  demoAvoidAreas,
  editableNodes,
  editableEdges,
  checkpointNodes,
  checkpointEdges,
} from "./DummyData";
import type { ReactFlowProps } from "@xyflow/react";

export type DemoGraphProps = ReactFlowProps;

const configuredStepEdgeTypes = {
  smartStep: createSmartEdge("step", { gridRatio: 5 }),
};

const configuredSmoothStepEdgeTypes = {
  smartSmoothStep: createSmartEdge("smoothstep", {
    drawEdge: svgDrawSmoothStepLinePath({ borderRadius: 20 }),
  }),
};

const avoidAreaEdgeTypes = {
  smartBezierAvoid: createSmartEdge("bezier", { avoidAreas: demoAvoidAreas }),
};

const smartBezierBase: DemoGraphProps = {
  edgeTypes,
  defaultNodes: nodes,
  defaultEdges: edgesBezier,
};

export const demoRegistry = {
  smartBezier: smartBezierBase,
  smartStraight: {
    ...smartBezierBase,
    defaultEdges: edgesStraight,
  },
  smartStep: {
    ...smartBezierBase,
    defaultEdges: edgesStep,
  },
  smartStepConfigured: {
    edgeTypes: configuredStepEdgeTypes,
    defaultNodes: nodes,
    defaultEdges: edgesStep,
  },
  smartSmoothStep: {
    ...smartBezierBase,
    defaultEdges: edgesSmoothStep,
  },
  smartSmoothStepConfigured: {
    edgeTypes: configuredSmoothStepEdgeTypes,
    defaultNodes: nodes,
    defaultEdges: edgesSmoothStep,
  },
  smartBezierWithCustomLabel: {
    ...smartBezierBase,
    defaultEdges: edgesLabel,
  },
  smartBezierSimple: {
    edgeTypes,
    defaultNodes: simpleNodes,
    defaultEdges: simpleEdgesBezier,
  },
  smartStepUnaligned: {
    edgeTypes,
    defaultNodes: unalignedNodes,
    defaultEdges: unalignedEdgesStep,
  },
  smartStepHorizontal: {
    edgeTypes,
    defaultNodes: horizontalNodes,
    defaultEdges: horizontalEdgesStep,
  },
  smartBezierSubFlow: {
    edgeTypes,
    defaultNodes: subFlowNodes,
    defaultEdges: subFlowEdgesBezier,
  },
  smartStepSubFlow: {
    edgeTypes,
    defaultNodes: subFlowNodes,
    defaultEdges: subFlowEdgesStep,
  },
  smartBezierSubFlowGroup: {
    edgeTypes,
    defaultNodes: subFlowGroupNodes,
    defaultEdges: subFlowGroupEdgesBezier,
  },
  smartStepSubFlowGroup: {
    edgeTypes,
    defaultNodes: subFlowGroupNodes,
    defaultEdges: subFlowGroupEdgesStep,
  },
  smartFloating: {
    edgeTypes,
    defaultNodes: floatingNodes,
    defaultEdges: floatingEdges,
  },
  smartFloatingWithConnectionLine: {
    edgeTypes,
    defaultNodes: floatingNodes,
    defaultEdges: floatingEdges,
    connectionLineComponent: SmartFloatingConnectionLine,
  },
  smartBezierWithAvoidArea: {
    edgeTypes: avoidAreaEdgeTypes,
    defaultNodes: avoidAreaNodes,
    defaultEdges: avoidAreaEdgesBezier,
  },
  smartEditable: {
    edgeTypes,
    defaultNodes: editableNodes,
    defaultEdges: editableEdges,
  },
  smartCheckpoint: {
    edgeTypes,
    defaultNodes: checkpointNodes,
    defaultEdges: checkpointEdges,
  },
} satisfies Record<string, DemoGraphProps>;

export type DemoName = keyof typeof demoRegistry;
