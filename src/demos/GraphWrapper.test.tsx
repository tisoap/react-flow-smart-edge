import { render } from "@testing-library/react";
import type { ReactFlowProps } from "@xyflow/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@xyflow/react/dist/style.css";

const reactFlowSpy = vi.hoisted(() => vi.fn<(props: ReactFlowProps) => void>());

vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  const ActualReactFlow = actual.ReactFlow;
  return {
    ...actual,
    ReactFlow: (props: ReactFlowProps) => {
      reactFlowSpy(props);
      return <ActualReactFlow {...props} />;
    },
  };
});

import { GraphWrapper } from "./GraphWrapper";

const renderGraph = (props: ReactFlowProps = {}) =>
  render(
    <div style={{ width: 400, height: 300 }}>
      <GraphWrapper defaultNodes={[]} defaultEdges={[]} {...props} />
    </div>,
  );

describe("GraphWrapper", () => {
  beforeEach(() => {
    reactFlowSpy.mockClear();
  });

  it("passes fitView by default", () => {
    renderGraph();

    expect(reactFlowSpy).toHaveBeenCalledWith(
      expect.objectContaining({ fitView: true }),
    );
  });

  it("allows fitView={false} to override the default", () => {
    renderGraph({ fitView: false });

    expect(reactFlowSpy).toHaveBeenCalledWith(
      expect.objectContaining({ fitView: false }),
    );
  });

  it("applies React Flow light color mode by default", () => {
    const { container } = renderGraph();

    expect(reactFlowSpy).toHaveBeenCalledWith(
      expect.objectContaining({ colorMode: "light" }),
    );

    const flow = container.querySelector(".react-flow");
    expect(flow).not.toBeNull();
    expect(flow?.classList.contains("light")).toBe(true);
    expect(flow?.classList.contains("dark")).toBe(false);
  });

  it("forwards colorMode=dark onto the React Flow root", () => {
    const { container } = renderGraph({ colorMode: "dark" });

    expect(reactFlowSpy).toHaveBeenCalledWith(
      expect.objectContaining({ colorMode: "dark" }),
    );

    const flow = container.querySelector(".react-flow");
    expect(flow?.classList.contains("dark")).toBe(true);
    expect(flow?.classList.contains("light")).toBe(false);
  });

  it("fills the parent height instead of a fixed 500px box", () => {
    const { getByTestId } = renderGraph();

    const wrapper = getByTestId("graph-wrapper");
    expect(wrapper).toHaveStyle({ height: "100%", width: "100%" });
    expect(wrapper).not.toHaveStyle({ background: "#fafafa" });
  });
});
