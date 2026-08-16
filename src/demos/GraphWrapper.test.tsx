import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GraphWrapper } from "./GraphWrapper";
import "@xyflow/react/dist/style.css";

describe("GraphWrapper", () => {
  it("applies React Flow light color mode by default", () => {
    const { container } = render(
      <div style={{ width: 400, height: 300 }}>
        <GraphWrapper defaultNodes={[]} defaultEdges={[]} />
      </div>,
    );

    const flow = container.querySelector(".react-flow");
    expect(flow).not.toBeNull();
    expect(flow?.classList.contains("light")).toBe(true);
    expect(flow?.classList.contains("dark")).toBe(false);
  });

  it("forwards colorMode=dark onto the React Flow root", () => {
    const { container } = render(
      <div style={{ width: 400, height: 300 }}>
        <GraphWrapper defaultNodes={[]} defaultEdges={[]} colorMode="dark" />
      </div>,
    );

    const flow = container.querySelector(".react-flow");
    expect(flow?.classList.contains("dark")).toBe(true);
  });

  it("fills the parent height instead of a fixed 500px box", () => {
    const { getByTestId } = render(
      <div style={{ width: 400, height: 240 }}>
        <GraphWrapper defaultNodes={[]} defaultEdges={[]} />
      </div>,
    );

    const wrapper = getByTestId("graph-wrapper");
    expect(wrapper).toHaveStyle({ height: "100%", width: "100%" });
    expect(wrapper).not.toHaveStyle({ background: "#fafafa" });
  });
});
