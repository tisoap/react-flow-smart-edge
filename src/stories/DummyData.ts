import { MarkerType } from 'reactflow'
import { SmartBezierEdge, SmartStraightEdge, SmartStepEdge } from '../index'
import { SmartEdgeCustomLabel } from './CustomLabel'
import type { Node, Edge } from 'reactflow'

const markerEndType = MarkerType.Arrow

export const edgeTypes = {
	smartBezier: SmartBezierEdge,
	smartStraight: SmartStraightEdge,
	smartStep: SmartStepEdge,
	smartBezierLabel: SmartEdgeCustomLabel
}

export type NodeData = {
	label: string
}

export type EdgeData = { customField: string } | undefined

export const nodes: Node<NodeData>[] = [
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
		id: '3',
		data: {
			label: 'Node 3'
		},
		position: {
			x: 40,
			y: 220
		}
	},
	{
		id: '4',
		data: {
			label: 'Node 4'
		},
		position: {
			x: 270,
			y: 220
		}
	},
	{
		id: '5',
		data: {
			label: 'Node 5'
		},
		position: {
			x: 470,
			y: 220
		}
	},
	{
		id: '6',
		data: {
			label: 'Node 6'
		},
		position: {
			x: 515,
			y: 310
		}
	},
	{
		id: '7',
		data: {
			label: 'Node 7'
		},
		position: {
			x: 470,
			y: 130
		}
	}
]

export const edgesBezier: Edge<EdgeData>[] = [
	{
		id: 'e12',
		source: '1',
		target: '2',
		type: 'smartBezier',
		markerEnd: { type: markerEndType },
		label: 'Edge Label'
	},
	{
		id: 'e17',
		source: '1',
		target: '7',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e23',
		source: '2',
		target: '3',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e24',
		source: '2',
		target: '4',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e25',
		source: '2',
		target: '5',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e56',
		source: '5',
		target: '6',
		type: 'smartBezier',
		markerEnd: { type: markerEndType },
		data: {
			customField: 'custom data'
		}
	},
	{
		id: 'e65',
		source: '6',
		target: '5',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e61',
		source: '6',
		target: '1',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	},
	{
		id: 'e3',
		source: '3',
		target: '3',
		type: 'smartBezier',
		markerEnd: { type: markerEndType }
	}
]

export const edgesStraight: Edge<EdgeData>[] = edgesBezier.map((edge) => ({
	...edge,
	type: 'smartStraight'
}))

export const edgesStep: Edge<EdgeData>[] = edgesBezier.map((edge) => ({
	...edge,
	type: 'smartStep'
}))

export const edgesLabel: Edge<EdgeData>[] = edgesBezier.map((edge) => ({
	...edge,
	type: 'smartBezierLabel'
}))
