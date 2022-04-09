import { MarkerType } from 'react-flow-renderer'

const markerEndType = MarkerType.Arrow

export const nodes1 = [
	{
		id: '1',
		data: {
			label: 'Node 1'
		},
		position: {
			x: 490,
			y: 40
		}
	},
	{
		id: '2',
		data: {
			label: 'Node 2'
		},
		position: {
			x: 270,
			y: 130
		}
	},
	{
		id: '2a',
		data: {
			label: 'Node 2a'
		},
		position: {
			x: 40,
			y: 220
		}
	},
	{
		id: '2b',
		data: {
			label: 'Node 2b'
		},
		position: {
			x: 270,
			y: 220
		}
	},
	{
		id: '2c',
		data: {
			label: 'Node 2c'
		},
		position: {
			x: 470,
			y: 220
		}
	},
	{
		id: '2d',
		data: {
			label: 'Node 2d'
		},
		position: {
			x: 515,
			y: 310
		}
	},
	{
		id: '3',
		data: {
			label: 'Node 3'
		},
		position: {
			x: 470,
			y: 130
		}
	}
]

export const edges1 = [
	{
		id: 'e12',
		source: '1',
		target: '2',
		type: 'smart',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e13',
		source: '1',
		target: '3',
		type: 'smart',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e22a',
		source: '2',
		target: '2a',
		type: 'smart',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e22b',
		source: '2',
		target: '2b',
		type: 'smart',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e22c',
		source: '2',
		target: '2c',
		type: 'smart',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e2c2d',
		source: '2c',
		target: '2d',
		type: 'smart',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e2d2c',
		source: '2d',
		target: '2c',
		type: 'smart',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e2d1',
		source: '2d',
		target: '1',
		type: 'smart',
		markerEnd: { type: markerEndType },
		label: 'Node 2d to Node 1'
	},
	{
		id: 'e2a2a',
		source: '2a',
		target: '2a',
		type: 'smart',
		markerEnd: { type: markerEndType }
	}
]

export const nodes2 = [
	{
		id: '1',
		data: { label: 'Node 1' },
		position: { x: 300, y: 100 }
	},
	{
		id: '2',
		data: { label: 'Node 2' },
		position: { x: 300, y: 200 }
	}
]

export const edges2 = [
	{
		id: 'e21',
		source: '2',
		target: '1',
		type: 'smart',
		label: 'Label'
	}
]
