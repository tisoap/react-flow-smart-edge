import { memo } from "react";
import type { CSSProperties } from "react";
import { useSmartEdgeDebug } from "./useSmartEdgeDebug";

export const SmartEdgeDebugOverlay = memo(() => {
  const { enabled, graphBox, avoidAreas } = useSmartEdgeDebug();

  if (!enabled || (!graphBox && avoidAreas.length === 0)) return null;

  const graphStyle: CSSProperties | null = graphBox && {
    position: "absolute",
    left: graphBox.x,
    top: graphBox.y,
    width: graphBox.width,
    height: graphBox.height,
    pointerEvents: "none",
    border: "1px solid red",
    backgroundColor: "transparent",
    boxSizing: "border-box",
    zIndex: 1,
  };

  return (
    <>
      {graphStyle && (
        <div style={graphStyle} data-testid="smart-edge-debug-overlay" />
      )}
      {avoidAreas.map((area, index) => {
        const style: CSSProperties = {
          position: "absolute",
          left: area.x,
          top: area.y,
          width: area.width,
          height: area.height,
          pointerEvents: "none",
          border: "1px dashed #2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.1)",
          boxSizing: "border-box",
          zIndex: 1,
        };
        return (
          <div
            key={`avoid-area-${String(index)}`}
            style={style}
            data-testid="smart-edge-avoid-area"
          />
        );
      })}
    </>
  );
});
