import React, { memo } from 'react'
import { useNodes } from 'react-flow-renderer'
import {
	svgDrawSmoothLinePath,
	pathfindingAStarDiagonal,
	toInteger
} from '../functions'
import { PathFindingEdge } from './PathFindingEdge'
import type { GetSmartEdgeOptions } from '../getSmartEdge'
import type { EdgeProps } from 'react-flow-renderer'

export const smartEdgeFactory = <
	EdgeDataType = unknown,
	NodeDataType = unknown
>({
	nodePadding = 10,
	gridRatio = 10,
	drawEdge = svgDrawSmoothLinePath,
	generatePath = pathfindingAStarDiagonal
}: GetSmartEdgeOptions) => {
	const options: GetSmartEdgeOptions = {
		nodePadding: toInteger(nodePadding, 2),
		gridRatio: toInteger(gridRatio, 2),
		drawEdge,
		generatePath
	}

	const RegularPathFindingEdge = memo((props: EdgeProps<EdgeDataType>) => {
		const storeNodes = useNodes<NodeDataType>()

		return (
			<PathFindingEdge<EdgeDataType, NodeDataType>
				{...props}
				storeNodes={storeNodes}
				options={options}
			/>
		)
	})

	RegularPathFindingEdge.displayName = 'RegularPathFindingEdge'
	return RegularPathFindingEdge
}
