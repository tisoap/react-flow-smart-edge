import { ArrowHeadType } from 'react-flow-renderer';

const arrowHeadType = ArrowHeadType.Arrow;

export const data = [
  {
    id: '1',
    data: {
      label: 'Node 1',
    },
    position: {
      x: 430,
      y: 0,
    },
  },
  {
    id: '2',
    data: {
      label: 'Node 2',
    },
    position: {
      x: 230,
      y: 90,
    },
  },
  {
    id: '2a',
    data: {
      label: 'Node 2a',
    },
    position: {
      x: 0,
      y: 180,
    },
  },
  {
    id: '2b',
    data: {
      label: 'Node 2b',
    },
    position: {
      x: 230,
      y: 180,
    },
  },
  {
    id: '2c',
    data: {
      label: 'Node 2c',
    },
    position: {
      x: 430,
      y: 180,
    },
  },
  {
    id: '2d',
    data: {
      label: 'Node 2d',
    },
    position: {
      x: 475,
      y: 270,
    },
  },
  {
    id: '3',
    data: {
      label: 'Node 3',
    },
    position: {
      x: 430,
      y: 90,
    },
  },
  {
    id: 'e12',
    source: '1',
    target: '2',
    type: 'pathFinding',
    arrowHeadType,
  },
  {
    id: 'e13',
    source: '1',
    target: '3',
    type: 'pathFinding',
    arrowHeadType,
  },
  {
    id: 'e22a',
    source: '2',
    target: '2a',
    type: 'pathFinding',
    arrowHeadType,
  },
  {
    id: 'e22b',
    source: '2',
    target: '2b',
    type: 'pathFinding',
    arrowHeadType,
  },
  {
    id: 'e22c',
    source: '2',
    target: '2c',
    type: 'pathFinding',
    arrowHeadType,
  },
  {
    id: 'e2c2d',
    source: '2c',
    target: '2d',
    type: 'pathFinding',
    arrowHeadType,
  },
  {
    id: 'e2d2c',
    source: '2d',
    target: '2c',
    type: 'pathFinding',
    arrowHeadType,
  },
  {
    id: 'e2d1',
    source: '2d',
    target: '1',
    type: 'pathFinding',
    arrowHeadType,
  },
  {
    id: 'e2a2a',
    source: '2a',
    target: '2a',
    type: 'pathFinding',
    arrowHeadType,
  },
];
