# React Flow Smart Edge

Special Edge for [React Flow](https://github.com/wbkd/react-flow) that never intersects with other nodes.

![Smart Edge](https://raw.githubusercontent.com/tisoap/react-flow-smart-edge/main/.github/images/example.gif)

## Install

```bash
npm install @tisoap/react-flow-smart-edge
```

## Usage

```jsx
import React from 'react';
import ReactFlow from 'react-flow-renderer';
import { SmartEdge } from '@tisoap/react-flow-smart-edge';

const elements = [
  {
    id: '1',
    data: { label: 'Node 1' },
    position: { x: 300, y: 100 },
  },
  {
    id: '2',
    data: { label: 'Node 2' },
    position: { x: 300, y: 200 },
  },
  {
    id: 'e21',
    source: '2',
    target: '1',
    type: 'smart',
  },
];

export const Graph = (props) => {
  const { children, ...rest } = props;

  return (
    <ReactFlow
      elements={elements}
      edgeTypes={{
        smart: SmartEdge,
      }}
      {...rest}
    >
      {children}
    </ReactFlow>
  );
};
```

## Options

The `SmartEdge` takes the same options as a [React Flow Edge](https://reactflow.dev/docs/api/edges/).

You can configure additional advanced options by wrapping your graph with `SmartEdgeProvider` and passing an `options` object. If an option is not provided it'll assume it's default value. The available options are:

```js
const options = {
  // Configure by how many milliseconds the Edge render should be
  // debounced. Default 200, 0 to disable.
  debounceTime: 200,

  // How many pixels of padding is added around nodes, or by how
  // much should the edge avoid the walls of a node. Default 10,
  // minimum 2.
  nodePadding: 10,

  // The size in pixels of each square grid cell used for path
  // finding. Smaller values for a more accurate path, bigger
  // for faster path finding. Default 10, minimum 2.
  gridRatio: 10,

  // The type of line that is draw. Available options are:
  // 'curve' - Curved lines with BezierEdge fallback (default)
  // 'straight' - Straight lines with StraightEdge fallback
  lineType: 'curve',

  // Boolean value to control if the path finding algorithm should
  // use less diagonal movement, default to false.
  lessCorners: false,
};
```

Usage:

```jsx
import React from 'react';
import ReactFlow from 'react-flow-renderer';
import { SmartEdge, SmartEdgeProvider } from '@tisoap/react-flow-smart-edge';
import elements from './elements';

export const Graph = (props) => {
  const { children, ...rest } = props;

  return (
    <SmartEdgeProvider options={{ debounceTime: 300 }}>
      <ReactFlow
        elements={elements}
        edgeTypes={{
          smart: SmartEdge,
        }}
        {...rest}
      >
        {children}
      </ReactFlow>
    </SmartEdgeProvider>
  );
};
```

## Examples

You can see Storybook examples by visiting this page: https://tisoap.github.io/react-flow-smart-edge/

There's also is a minimum example in this repository [`example` folder](https://github.com/tisoap/react-flow-smart-edge/tree/main/example). Clone this repository and run `yarn; cd example; yarn; yarn start`.

## License

This project is [MIT](https://github.com/tisoap/react-flow-smart-edge/blob/main/LICENSE) licensed.

### Support

Liked this project and want to show your support? Buy me a coffee:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/J3J472RAJ)
