import React, { memo, useState } from 'react'
import { useNodes, BezierEdge } from 'react-flow-renderer'
import useDebounce from 'react-use/lib/useDebounce'
import {
	svgDrawSmoothLinePath,
	pathfindingAStarDiagonal,
	toInteger
} from '../functions'
import { PathFindingEdge } from './PathFindingEdge'
import type {
	SmartEdgeOptions,
	SmartEdgeAdvancedOptions
} from './PathFindingEdge'
import type { EdgeProps } from 'react-flow-renderer'

export type { SmartEdgeOptions, SmartEdgeAdvancedOptions }

export type FactoryOptions<EdgeDataType = unknown> = Partial<
	SmartEdgeOptions<EdgeDataType>
>
export type AdvancedFactoryOptions<EdgeDataType = unknown> = Partial<
	SmartEdgeAdvancedOptions<EdgeDataType>
>

export const smartEdgeFactory = <
	EdgeDataType = unknown,
	NodeDataType = unknown
>({
	debounceTime = 200,
	nodePadding = 10,
	gridRatio = 10,
	drawEdge = svgDrawSmoothLinePath,
	generatePath = pathfindingAStarDiagonal,
	fallback = BezierEdge,
	customEdgeLabel = undefined
}: AdvancedFactoryOptions<EdgeDataType>) => {
	const options: SmartEdgeAdvancedOptions<EdgeDataType> = {
		debounceTime: toInteger(debounceTime),
		nodePadding: toInteger(nodePadding, 2),
		gridRatio: toInteger(gridRatio, 2),
		drawEdge,
		generatePath,
		fallback,
		customEdgeLabel
	}

	if (debounceTime === 0) {
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

	const DebouncedPathFindingEdge = memo((props: EdgeProps) => {
		const storeNodes = useNodes()
		const [debouncedProps, setDebouncedProps] = useState({
			storeNodes,
			...props
		})

		useDebounce(
			() => {
				setDebouncedProps({
					storeNodes,
					...props
				})
			},
			debounceTime,
			[props, storeNodes]
		)

		return <PathFindingEdge {...debouncedProps} options={options} />
	})

	DebouncedPathFindingEdge.displayName = 'DebouncedPathFindingEdge'
	return DebouncedPathFindingEdge
}
