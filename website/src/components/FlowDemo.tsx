import BrowserOnly from "@docusaurus/BrowserOnly";
import { lazy, Suspense, type ReactNode } from "react";

const FlowDemoClient = lazy(() => import("./FlowDemoClient"));

export interface FlowDemoProps {
  name: string;
  height?: number;
}

export function FlowDemo({ name, height = 420 }: FlowDemoProps): ReactNode {
  const fallback = <div style={{ height }} />;

  return (
    <BrowserOnly fallback={fallback}>
      {() => (
        <Suspense fallback={fallback}>
          <FlowDemoClient name={name} height={height} />
        </Suspense>
      )}
    </BrowserOnly>
  );
}
