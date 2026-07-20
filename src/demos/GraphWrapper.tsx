import { ReactFlow, ReactFlowProvider, useNodes } from "@xyflow/react";
import { SmartEdgeProvider } from "../routing/SmartEdgeProvider";
import type { ReactFlowProps } from "@xyflow/react";
import type { ReactNode } from "react";

const style = {
  background: "#fafafa",
  width: "100%",
  height: "500px",
};

export type GraphWrapperProps = ReactFlowProps;

/**
 * Feeds React Flow's live nodes into a `SmartEdgeProvider` that wraps the flow,
 * so demo and story edges route through the v5 provider pipeline. Demos route
 * every edge (`routeOnlyWhenBlocked: false`) to mirror v4's always-on routing,
 * where an unblocked edge still rendered its smart path rather than falling
 * back to the native one.
 */
function DemoSmartEdgeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const nodes = useNodes();

  return (
    <SmartEdgeProvider nodes={nodes} options={{ routeOnlyWhenBlocked: false }}>
      {children}
    </SmartEdgeProvider>
  );
}

export const GraphWrapper = (props: GraphWrapperProps) => (
  <ReactFlowProvider>
    <DemoSmartEdgeProvider>
      <div
        data-testid="graph-wrapper"
        style={{ ...style, position: "relative" }}
      >
        <ReactFlow {...props} />
      </div>
    </DemoSmartEdgeProvider>
  </ReactFlowProvider>
);
