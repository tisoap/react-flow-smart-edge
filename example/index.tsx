import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Graph } from '../stories/SmartEdge/Graph';
import { data } from '../stories/SmartEdge/dummyData';

const style = {
  background: '#fafafa',
  width: '100%',
  height: '100%',
};

const App = () => {
  return (
    <div style={style}>
      <Graph elements={data} />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
