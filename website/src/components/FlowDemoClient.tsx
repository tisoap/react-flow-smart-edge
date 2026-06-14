import { demoRegistry } from "@demos/registry";
import { GraphWrapper } from "@demos/GraphWrapper";
import "@xyflow/react/dist/style.css";

export interface FlowDemoClientProps {
  name: string;
  height?: number;
}

export default function FlowDemoClient({
  name,
  height = 420,
}: FlowDemoClientProps) {
  const props = demoRegistry[name as keyof typeof demoRegistry];
  if (!props) {
    return <p>Unknown demo: {name}</p>;
  }

  return (
    <div
      style={{
        width: "100%",
        height,
        marginBottom: "1rem",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid var(--ifm-color-emphasis-300)",
      }}
    >
      <GraphWrapper {...props} />
    </div>
  );
}
