import { createContext, useContext } from "react";

export interface SmartEdgeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SmartEdgeGraphBox = SmartEdgeBox | null;

export interface SmartEdgeDebugContextValue {
  enabled: boolean;
  graphBox: SmartEdgeGraphBox;
  setGraphBox: (next: SmartEdgeGraphBox) => void;
  avoidAreas: SmartEdgeBox[];
  setAvoidAreas: (next: SmartEdgeBox[]) => void;
}

export const SmartEdgeDebugContext = createContext<SmartEdgeDebugContextValue>({
  enabled: false,
  graphBox: null,
  setGraphBox: () => {
    // Do nothing
  },
  avoidAreas: [],
  setAvoidAreas: () => {
    // Do nothing
  },
});

export const useSmartEdgeDebug = (): SmartEdgeDebugContextValue => {
  return useContext(SmartEdgeDebugContext);
};
