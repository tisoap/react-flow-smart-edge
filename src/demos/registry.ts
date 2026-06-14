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
} from "./DummyData";
import type { ReactFlowProps } from "@xyflow/react";

export type DemoGraphProps = ReactFlowProps & {
  smartEdgeDebug?: boolean;
};

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
  smartEdgeDebug: false,
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
    smartEdgeDebug: true,
  },
  smartSmoothStep: {
    ...smartBezierBase,
    defaultEdges: edgesSmoothStep,
  },
  smartSmoothStepConfigured: {
    edgeTypes: configuredSmoothStepEdgeTypes,
    defaultNodes: nodes,
    defaultEdges: edgesSmoothStep,
    smartEdgeDebug: true,
  },
  smartBezierWithCustomLabel: {
    ...smartBezierBase,
    defaultEdges: edgesLabel,
  },
  smartBezierSimple: {
    edgeTypes,
    defaultNodes: simpleNodes,
    defaultEdges: simpleEdgesBezier,
    smartEdgeDebug: false,
  },
  smartStepUnaligned: {
    edgeTypes,
    defaultNodes: unalignedNodes,
    defaultEdges: unalignedEdgesStep,
    smartEdgeDebug: false,
  },
  smartStepHorizontal: {
    edgeTypes,
    defaultNodes: horizontalNodes,
    defaultEdges: horizontalEdgesStep,
    smartEdgeDebug: false,
  },
  smartBezierSubFlow: {
    edgeTypes,
    defaultNodes: subFlowNodes,
    defaultEdges: subFlowEdgesBezier,
    smartEdgeDebug: false,
  },
  smartStepSubFlow: {
    edgeTypes,
    defaultNodes: subFlowNodes,
    defaultEdges: subFlowEdgesStep,
    smartEdgeDebug: false,
  },
  smartBezierSubFlowGroup: {
    edgeTypes,
    defaultNodes: subFlowGroupNodes,
    defaultEdges: subFlowGroupEdgesBezier,
    smartEdgeDebug: false,
  },
  smartStepSubFlowGroup: {
    edgeTypes,
    defaultNodes: subFlowGroupNodes,
    defaultEdges: subFlowGroupEdgesStep,
    smartEdgeDebug: false,
  },
  smartFloating: {
    edgeTypes,
    defaultNodes: floatingNodes,
    defaultEdges: floatingEdges,
    smartEdgeDebug: false,
  },
  smartFloatingWithConnectionLine: {
    edgeTypes,
    defaultNodes: floatingNodes,
    defaultEdges: floatingEdges,
    connectionLineComponent: SmartFloatingConnectionLine,
    smartEdgeDebug: false,
  },
  smartBezierWithAvoidArea: {
    edgeTypes: avoidAreaEdgeTypes,
    defaultNodes: avoidAreaNodes,
    defaultEdges: avoidAreaEdgesBezier,
    smartEdgeDebug: true,
  },
  smartEditable: {
    edgeTypes,
    defaultNodes: editableNodes,
    defaultEdges: editableEdges,
    smartEdgeDebug: false,
  },
} satisfies Record<string, DemoGraphProps>;

export type DemoName = keyof typeof demoRegistry;
