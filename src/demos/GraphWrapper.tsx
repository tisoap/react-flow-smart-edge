import { ReactFlow } from "@xyflow/react";
import type { ReactFlowProps } from "@xyflow/react";

const style = {
  background: "#fafafa",
  width: "100%",
  height: "500px",
};

export type GraphWrapperProps = ReactFlowProps;

export const GraphWrapper = (props: GraphWrapperProps) => (
  <div data-testid="graph-wrapper" style={{ ...style, position: "relative" }}>
    <ReactFlow {...props} />
  </div>
);
