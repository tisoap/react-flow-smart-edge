import { useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type {
  SmartEdgeBox,
  SmartEdgeGraphBox,
  SmartEdgeDebugContextValue,
} from "./useSmartEdgeDebug";
import { SmartEdgeDebugContext } from "./useSmartEdgeDebug";

interface SmartEdgeDebugProviderProps {
  value?: boolean;
}

const areAreasEqual = (a: SmartEdgeBox[], b: SmartEdgeBox[]) =>
  a.length === b.length &&
  a.every((box, index) => {
    const next = b[index];
    return (
      box.x === next.x &&
      box.y === next.y &&
      box.width === next.width &&
      box.height === next.height
    );
  });

export const SmartEdgeDebugProvider = ({
  value = true,
  children,
}: PropsWithChildren<SmartEdgeDebugProviderProps>) => {
  const [graph, setGraph] = useState<SmartEdgeGraphBox>(null);
  const [areas, setAreas] = useState<SmartEdgeBox[]>([]);

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

  const setAvoidAreas = (next: SmartEdgeBox[]) => {
    setAreas((prev) => (areAreasEqual(prev, next) ? prev : next));
  };

  const contextValue = useMemo<SmartEdgeDebugContextValue>(
    () => ({
      enabled: value,
      graphBox: graph,
      setGraphBox,
      avoidAreas: areas,
      setAvoidAreas,
    }),
    [value, graph, areas],
  );

  return (
    <SmartEdgeDebugContext.Provider value={contextValue}>
      {children}
    </SmartEdgeDebugContext.Provider>
  );
};
