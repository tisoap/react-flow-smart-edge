import { ReactFlow, ReactFlowProvider, useNodes } from "@xyflow/react";
import { SmartEdgeProvider } from "../routing/SmartEdgeProvider";
import type { SmartEdgeProviderOptions } from "../routing/routingContext";
import type { SmartEdgeMetrics } from "../routing/scheduler";
import type { ReactFlowProps } from "@xyflow/react";
import type { ReactNode } from "react";

const style = {
  background: "#fafafa",
  width: "100%",
  height: "500px",
};

export type GraphWrapperProps = ReactFlowProps & {
  /** Overrides merged over the demo's default `SmartEdgeProvider` options
   * (`routeOnlyWhenBlocked: false`), so a story can flip a single option
   * (e.g. `routeOnlyWhenBlocked: true`) without losing the rest. */
  providerOptions?: SmartEdgeProviderOptions;
  /** Forwarded to `SmartEdgeProvider`'s `onMetrics`, for stories/demos that
   * want to observe routing batch metrics. */
  onMetrics?: (metrics: SmartEdgeMetrics) => void;
};

/**
 * Feeds React Flow's live nodes into a `SmartEdgeProvider` that wraps the flow,
 * so demo and story edges route through the v5 provider pipeline. Demos route
 * every edge (`routeOnlyWhenBlocked: false`) to mirror v4's always-on routing,
 * where an unblocked edge still rendered its smart path rather than falling
 * back to the native one, unless a story overrides that via `providerOptions`.
 */
function DemoSmartEdgeProvider({
  providerOptions,
  onMetrics,
  children,
}: Readonly<{
  providerOptions?: SmartEdgeProviderOptions;
  onMetrics?: (metrics: SmartEdgeMetrics) => void;
  children: ReactNode;
}>) {
  const nodes = useNodes();

  return (
    <SmartEdgeProvider
      nodes={nodes}
      options={{ routeOnlyWhenBlocked: false, ...providerOptions }}
      onMetrics={onMetrics}
    >
      {children}
    </SmartEdgeProvider>
  );
}

export const GraphWrapper = ({
  providerOptions,
  onMetrics,
  ...props
}: GraphWrapperProps) => (
  <ReactFlowProvider>
    <DemoSmartEdgeProvider
      providerOptions={providerOptions}
      onMetrics={onMetrics}
    >
      <div
        data-testid="graph-wrapper"
        style={{ ...style, position: "relative" }}
      >
        <ReactFlow {...props} />
      </div>
    </DemoSmartEdgeProvider>
  </ReactFlowProvider>
);
