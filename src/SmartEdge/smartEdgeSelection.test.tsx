import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createSmartEdgeStore } from "../routing/providerStore";
import { useEndpointNodesSelected } from "./smartEdgeSelection";
import type { SmartEdgeStore } from "../routing/providerStore";

function Probe({
  store,
  source,
  target,
  onResult,
}: Readonly<{
  store: SmartEdgeStore | undefined;
  source: string;
  target: string;
  onResult: (selected: boolean) => void;
}>) {
  onResult(useEndpointNodesSelected(store, source, target));
  return null;
}

describe("useEndpointNodesSelected", () => {
  it("reports true when an endpoint node is selected", () => {
    const store = createSmartEdgeStore();
    store.setNodeState(new Set(), new Set(["aaa"]));
    const box = { current: false };

    render(
      <Probe
        store={store}
        source="aaa"
        target="bbb"
        onResult={(value) => {
          box.current = value;
        }}
      />,
    );

    expect(box.current).toBe(true);
  });

  it("reports false when no endpoint node is selected", () => {
    const store = createSmartEdgeStore();
    store.setNodeState(new Set(), new Set(["ccc"]));
    const box = { current: true };

    render(
      <Probe
        store={store}
        source="aaa"
        target="bbb"
        onResult={(value) => {
          box.current = value;
        }}
      />,
    );

    expect(box.current).toBe(false);
  });

  it("reports false when there is no provider store", () => {
    const box = { current: true };

    render(
      <Probe
        store={undefined}
        source="aaa"
        target="bbb"
        onResult={(value) => {
          box.current = value;
        }}
      />,
    );

    expect(box.current).toBe(false);
  });

  it("resolves to false on the server via the idle snapshot", () => {
    const box = { current: true };

    renderToStaticMarkup(
      <Probe
        store={undefined}
        source="aaa"
        target="bbb"
        onResult={(value) => {
          box.current = value;
        }}
      />,
    );

    expect(box.current).toBe(false);
  });
});
