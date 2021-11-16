import React from 'react';
import * as ReactDOM from 'react-dom';
import { data } from '../stories/SmartEdge/dummyData';
import { DefaultExample as Graph } from '../stories/SmartEdge/SmartEdge.stories';

describe('Graph with Smart Edge', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Graph elements={data} />, div);
  });
});
