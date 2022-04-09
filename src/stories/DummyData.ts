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

export const edges1Bezier = [
	{
		id: 'e12',
		source: '1',
		target: '2',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e13',
		source: '1',
		target: '3',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e22a',
		source: '2',
		target: '2a',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e22b',
		source: '2',
		target: '2b',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e22c',
		source: '2',
		target: '2c',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e2c2d',
		source: '2c',
		target: '2d',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e2d2c',
		source: '2d',
		target: '2c',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e2d1',
		source: '2d',
		target: '1',
		type: 'smartBezier',
		markerEnd: { type: markerEndType },
		label: 'Node 2d to Node 1'
	},
	{
		id: 'e2a2a',
		source: '2a',
		target: '2a',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	}
]

export const edges2Bezier = [
	{
		id: 'e21',
		source: '2',
		target: '1',
		type: 'smartBezier',
		label: 'Label'
	}
]

export const edges1Straight = edges1Bezier.map((edge) => ({
	...edge,
	type: 'smartStraight'
}))

export const edges1Mixed = edges1Bezier.map((edge, index) => ({
	...edge,
	type: index % 2 === 0 ? 'smartStraight' : 'smartBezier'
}))
