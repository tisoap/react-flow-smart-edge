import { ReactFlow } from "@xyflow/react";
import type { ReactFlowProps } from "@xyflow/react";
import { SmartEdgeDebugProvider } from "../internal/SmartEdgeDebug";
import { SmartEdgeDebugOverlay } from "../internal/SmartEdgeDebugOverlay";

const style = {
  background: "#fafafa",
  width: "100%",
  height: "500px",
};

export interface GraphWrapperProps extends ReactFlowProps {
  smartEdgeDebug?: boolean;
}

export const GraphWrapper = ({
  smartEdgeDebug,
  ...reactFlowProps
}: GraphWrapperProps) => (
  <SmartEdgeDebugProvider value={smartEdgeDebug}>
    <div data-testid="graph-wrapper" style={{ ...style, position: "relative" }}>
      <ReactFlow {...reactFlowProps} />
      <SmartEdgeDebugOverlay />
    </div>
  </SmartEdgeDebugProvider>
);
