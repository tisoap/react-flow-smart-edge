import React from 'react';
import ReactFlow from 'react-flow-renderer';
import { SmartEdge, SmartEdgeProvider } from '../../src/index';
import type { SmartEdgeOptions } from '../../src/index';
import type { ReactFlowProps } from 'react-flow-renderer';

export type GraphProps = ReactFlowProps;

export const Graph = (props: ReactFlowProps) => {
  const { children, ...rest } = props;

  const style = {
    background: '#fafafa',
    width: '100%',
    height: 500,
  };

  return (
    <ReactFlow
      style={style}
      maxZoom={1}
      minZoom={0.5}
      edgeTypes={{
        smart: SmartEdge,
      }}
      {...rest}
    >
      {children}
    </ReactFlow>
  );
};

export type GraphWithProviderProps = GraphProps & {
  options: SmartEdgeOptions;
};

export const GraphWithProvider = ({
  options,
  ...rest
}: GraphWithProviderProps) => {
  return (
    <SmartEdgeProvider options={options}>
      <Graph {...rest} />
    </SmartEdgeProvider>
  );
};
