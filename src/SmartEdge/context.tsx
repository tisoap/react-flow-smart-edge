import React, { createContext, useContext } from 'react';
import warning from 'tiny-warning';
import { toInteger } from './utils';
import type { ReactNode } from 'react';

export type SmartEdgeOptions = {
  debounceTime?: number;
  nodePadding?: number;
  gridRatio?: number;
  lineType?: 'curve' | 'straight';
  lessCorners?: boolean;
};

const defaultOptions: SmartEdgeOptions = {
  debounceTime: 200,
  nodePadding: 10,
  gridRatio: 10,
  lineType: 'curve',
  lessCorners: false,
};

export const SmartEdgeContext = createContext<SmartEdgeOptions | undefined>(
  defaultOptions
);

interface ProviderProps {
  children: ReactNode;
  options?: SmartEdgeOptions;
}

export const SmartEdgeProvider = ({
  children,
  options = defaultOptions,
}: ProviderProps) => {
  let {
    debounceTime = 200,
    nodePadding = 10,
    gridRatio = 10,
    lineType = 'curve',
    lessCorners = false,
  } = options;

  // Guarantee that all values are positive integers
  gridRatio = toInteger(gridRatio, 2);
  nodePadding = toInteger(nodePadding, 2);
  debounceTime = toInteger(debounceTime);

  // Guarantee correct line type
  if (lineType !== 'curve' && lineType !== 'straight') {
    lineType = 'curve';
  }

  warning(
    debounceTime >= 30,
    'A small debounce time on SmartEdge can cause performance issues on large graphs.'
  );

  warning(
    gridRatio >= 10,
    'A small grid ratio on SmartEdge can cause performance issues on large graphs.'
  );

  return (
    <SmartEdgeContext.Provider
      value={{ debounceTime, nodePadding, gridRatio, lineType, lessCorners }}
    >
      {children}
    </SmartEdgeContext.Provider>
  );
};

export const useSmartEdge = () => {
  const context = useContext(SmartEdgeContext);

  if (context === undefined) {
    throw new Error('useSmartEdge must be used within a SmartEdgeProvider');
  }

  if (
    context.debounceTime === undefined ||
    context.gridRatio === undefined ||
    context.nodePadding === undefined ||
    context.lineType === undefined
  ) {
    throw new Error('Missing options on SmartEdgeProvider');
  }

  return context as Required<SmartEdgeOptions>;
};
