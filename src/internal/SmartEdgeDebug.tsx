import { useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type {
  SmartEdgeGraphBox,
  SmartEdgeDebugContextValue,
} from "./useSmartEdgeDebug";
import { SmartEdgeDebugContext } from "./useSmartEdgeDebug";

interface SmartEdgeDebugProviderProps {
  value?: boolean;
}

export const SmartEdgeDebugProvider = ({
  value = true,
  children,
}: PropsWithChildren<SmartEdgeDebugProviderProps>) => {
  const [graph, setGraph] = useState<SmartEdgeGraphBox>(null);

  const setGraphBox = (next: SmartEdgeGraphBox) => {
    setGraph((prev) => {
      if (
        prev?.x === next?.x &&
        prev?.y === next?.y &&
        prev?.width === next?.width &&
        prev?.height === next?.height
      ) {
        return prev;
      }
      return next;
    });
  };

  const contextValue = useMemo<SmartEdgeDebugContextValue>(
    () => ({ enabled: value, graphBox: graph, setGraphBox }),
    [value, graph],
  );

  return (
    <SmartEdgeDebugContext.Provider value={contextValue}>
      {children}
    </SmartEdgeDebugContext.Provider>
  );
};
