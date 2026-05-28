import { useNodes, StepEdge } from "@xyflow/react";
import { SmartEdge } from "../SmartEdge";
import {
  svgDrawStraightLinePath,
  pathfindingJumpPointNoDiagonal,
} from "../functions";
import type { SmartEdgeOptions } from "../SmartEdge";
import type { Edge, EdgeProps, Node } from "@xyflow/react";

const StepConfiguration: SmartEdgeOptions = {
  drawEdge: svgDrawStraightLinePath,
  generatePath: pathfindingJumpPointNoDiagonal,
  fallback: StepEdge,
};

export function SmartStepEdge<
  EdgeType extends Edge = Edge,
  NodeType extends Node = Node,
>(props: EdgeProps<EdgeType>) {
  const nodes = useNodes<NodeType>();

  return (
    <SmartEdge<EdgeType, NodeType>
      {...props}
      options={StepConfiguration}
      nodes={nodes}
    />
  );
}
