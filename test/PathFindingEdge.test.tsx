import React from 'react';
import * as ReactDOM from 'react-dom';
import { data } from '../stories/PathFindingEdge/dummyData';
import { Default as Graph } from '../stories/PathFindingEdge/PathFindingEdge.stories';

describe('Graph with Path Finding Edge', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Graph elements={data} />, div);
  });
});
