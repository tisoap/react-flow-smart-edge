import React from 'react';
import ReactFlow from 'react-flow-renderer';
import { PathFindingEdge } from '../../src/index';
import type { ReactFlowProps } from 'react-flow-renderer';

export type { ReactFlowProps as GraphProps };

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
      edgeTypes={{
        pathFinding: PathFindingEdge,
      }}
      {...rest}
    >
      {children}
    </ReactFlow>
  );
};
