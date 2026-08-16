import { Position, ReactFlowProvider } from "@xyflow/react";
import { render } from "@testing-library/react";
import { useContext } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SvgWrapper } from "../../vitest/svgWrapper";
import { createSmartEdge } from "./index";
import { SmartEdgeProvider } from "../routing/SmartEdgeProvider";
import { SmartEdgeRoutingContext } from "../routing/routingContext";
import type { SmartEdgeContextValue } from "../routing/routingContext";
import type { Node } from "@xyflow/react";

const nodes: Node[] = [
  {
    id: "aaa",
    position: { x: 0, y: 0 },
    measured: { width: 50, height: 50 },
    data: {},
  },
  {
    id: "bbb",
    position: { x: 300, y: 0 },
    measured: { width: 50, height: 50 },
    data: {},
  },
];

const edgeProps = {
  id: "e1",
  type: "smart",
  data: {},
  source: "aaa",
  target: "bbb",
  sourceX: 50,
  sourceY: 25,
  targetX: 300,
  targetY: 25,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

describe("createSmartEdge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("names the component after its preset", () => {
    const Configured = createSmartEdge("step");
    expect(Configured.displayName).toBe("SmartEdge(step)");
  });

  it("forwards the preset and merged options to the registration", () => {
    const Configured = createSmartEdge("step", { gridRatio: 5 });
    const box: { current: SmartEdgeContextValue | null } = { current: null };

    render(
      <ReactFlowProvider>
        <SmartEdgeProvider nodes={nodes}>
          <ContextCapture
            onContext={(context) => {
              box.current = context;
            }}
          />
          <SvgWrapper>
            <Configured {...edgeProps} />
          </SvgWrapper>
        </SmartEdgeProvider>
      </ReactFlowProvider>,
    );

    const registration = box.current?.getRegistrationsInOrder()[0];
    expect(registration?.preset).toBe("step");
    expect(registration?.options?.gridRatio).toBe(5);
  });
});

function ContextCapture({
  onContext,
}: Readonly<{
  onContext: (context: SmartEdgeContextValue | null) => void;
}>) {
  onContext(useContext(SmartEdgeRoutingContext));
  return null;
}
