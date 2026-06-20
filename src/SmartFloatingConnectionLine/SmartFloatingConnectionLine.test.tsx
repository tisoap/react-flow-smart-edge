import {
  ConnectionLineType,
  Position,
  type InternalNode,
  type Node,
} from "@xyflow/react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SvgWrapper } from "../../vitest/svgWrapper";
import * as getSmartEdgeModule from "../getSmartEdge";
import {
  SmartFloatingConnectionLine,
  type SmartFloatingConnectionLineProps,
} from "./index";

const hubUserNode: Node = {
  id: "hub",
  position: { x: 100, y: 100 },
  measured: { width: 80, height: 40 },
  data: {},
};

const fromNode: InternalNode<Node> = {
  ...hubUserNode,
  measured: { width: 80, height: 40 },
  internals: {
    positionAbsolute: { x: 100, y: 100 },
    z: 0,
    userNode: hubUserNode,
  },
};

const nodes = [hubUserNode];

vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  return {
    ...actual,
    useNodes: () => nodes,
  };
});

const baseProps: SmartFloatingConnectionLineProps = {
  connectionLineType: ConnectionLineType.Bezier,
  fromNode,
  fromHandle: {
    nodeId: "hub",
    type: "source",
    position: Position.Right,
    x: 80,
    y: 20,
    width: 8,
    height: 8,
  },
  fromX: 180,
  fromY: 120,
  toX: 320,
  toY: 140,
  fromPosition: Position.Right,
  toPosition: Position.Left,
  connectionStatus: null,
  toNode: null,
  toHandle: null,
  pointer: { x: 320, y: 140 },
};

describe("SmartFloatingConnectionLine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a routed preview path to the cursor", () => {
    const { container } = render(
      <SvgWrapper>
        <SmartFloatingConnectionLine {...baseProps} />
      </SvgWrapper>,
    );

    const path = container.querySelector(".react-flow__connection-path");
    expect(path?.getAttribute("d")).toBeTruthy();
    expect(container.querySelector("circle")).toBeTruthy();
  });

  it("falls back to a straight preview when routing fails", () => {
    vi.spyOn(getSmartEdgeModule, "getSmartEdge").mockReturnValue(
      new Error("blocked"),
    );

    const { container } = render(
      <SvgWrapper>
        <SmartFloatingConnectionLine
          {...baseProps}
          connectionLineStyle={{ stroke: "red" }}
          options={{ gridRatio: 2, nodePadding: 2 }}
        />
      </SvgWrapper>,
    );

    expect(
      container
        .querySelector(".react-flow__connection-path")
        ?.getAttribute("d"),
    ).toContain("M");
  });
});
