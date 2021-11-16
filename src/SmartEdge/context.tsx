import React, { createContext, useContext } from 'react';
import warning from 'tiny-warning';
import type { ReactNode } from 'react';

export type SmartEdgeOptions = {
  debounceTime: number;
};

const defaultOptions: SmartEdgeOptions = {
  debounceTime: 200,
};

export const SmartEdgeContext = createContext<SmartEdgeOptions | undefined>(
  defaultOptions
);

interface ProviderProps {
  children: ReactNode;
  value?: SmartEdgeOptions;
}

export const SmartEdgeProvider = ({
  children,
  value = defaultOptions,
}: ProviderProps) => {
  warning(
    value.debounceTime > 30,
    'A small debounce time on SmartEdge can cause performance issues on large graphs.'
  );

  return (
    <SmartEdgeContext.Provider value={value}>
      {children}
    </SmartEdgeContext.Provider>
  );
};

export const useSmartEdge = () => {
  const context = useContext(SmartEdgeContext);

  if (context === undefined) {
    throw new Error('useSmartEdge must be used within a SmartEdgeProvider');
  }

  return context;
};
