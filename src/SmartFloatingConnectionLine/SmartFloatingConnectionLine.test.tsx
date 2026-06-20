import { Position } from "@xyflow/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import * as getSmartEdgeModule from "../getSmartEdge";
import { SmartFloatingConnectionLine } from "./index";

const nodes = [
  {
    id: "hub",
    position: { x: 100, y: 100 },
    measured: { width: 80, height: 40 },
    data: {},
  },
];

vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  return {
    ...actual,
    useNodes: () => nodes,
  };
});

describe("SmartFloatingConnectionLine", () => {
  const fromNode = {
    id: "hub",
    internals: { positionAbsolute: { x: 100, y: 100 } },
    measured: { width: 80, height: 40 },
  } as const;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a routed preview path to the cursor", () => {
    const { container } = render(
      <SmartFloatingConnectionLine
        fromNode={fromNode}
        toX={320}
        toY={140}
        toPosition={Position.Left}
      />,
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
      <SmartFloatingConnectionLine
        fromNode={fromNode}
        toX={320}
        toY={140}
        toPosition={Position.Left}
        connectionLineStyle={{ stroke: "red" }}
        options={{ gridRatio: 2, nodePadding: 2 }}
      />,
    );

    expect(
      container.querySelector(".react-flow__connection-path")?.getAttribute("d"),
    ).toContain("M");
  });
});
