// End-to-end `routeSmartEdgeBatch` benchmark at 10/100/750 nodes — the
// exact function the Web Worker (and its main-thread fallback) call to route
// a whole graph's edges in one pass.
import { bench, describe } from "vitest";
import { routeSmartEdgeBatch } from "../src/routing/routeBatch";
import { graph10, graph100, graph750, graphToBatchItems } from "./fixtures";

describe("routeSmartEdgeBatch end-to-end", () => {
  const items10 = graphToBatchItems(graph10);
  const items100 = graphToBatchItems(graph100);
  const items750 = graphToBatchItems(graph750);

  bench(`10 nodes / ${String(items10.length)} edges`, () => {
    routeSmartEdgeBatch(graph10.nodes, items10);
  });

  bench(`100 nodes / ${String(items100.length)} edges`, () => {
    routeSmartEdgeBatch(graph100.nodes, items100);
  });

  bench(`750 nodes / ${String(items750.length)} edges`, () => {
    routeSmartEdgeBatch(graph750.nodes, items750);
  });
});
