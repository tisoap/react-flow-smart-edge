import { useNodes } from "@xyflow/react";
import { SmartEdge } from "../SmartEdge";
import { smartEdgePresets } from "../smartEdgePresets";
import type { SmartEdgeOptions } from "../SmartEdge";
import type { SmartEdgePreset } from "../smartEdgePresets";
import type { EdgeProps, EdgeTypes } from "@xyflow/react";

type SmartEdgeComponent = EdgeTypes[string];

export type ConfigureSmartEdgeOptions = Partial<SmartEdgeOptions>;

export function createSmartEdge(
  preset: SmartEdgePreset,
  options?: ConfigureSmartEdgeOptions,
): SmartEdgeComponent {
  const mergedOptions: SmartEdgeOptions = {
    ...smartEdgePresets[preset],
    ...options,
  };

  function ConfiguredSmartEdge(props: EdgeProps) {
    const nodes = useNodes();

    return <SmartEdge {...props} nodes={nodes} options={mergedOptions} />;
  }

  ConfiguredSmartEdge.displayName = `SmartEdge(${preset})`;

  return ConfiguredSmartEdge;
}
