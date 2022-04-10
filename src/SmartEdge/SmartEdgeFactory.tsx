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

export type FactoryOptions = Partial<SmartEdgeOptions>
export type AdvancedFactoryOptions = Partial<SmartEdgeAdvancedOptions>

export const smartEdgeFactory = ({
	debounceTime = 200,
	nodePadding = 10,
	gridRatio = 10,
	drawEdge = svgDrawSmoothLinePath,
	generatePath = pathfindingAStarDiagonal,
	fallback = BezierEdge
}: AdvancedFactoryOptions) => {
	const options: SmartEdgeAdvancedOptions = {
		debounceTime: toInteger(debounceTime),
		nodePadding: toInteger(nodePadding, 2),
		gridRatio: toInteger(gridRatio, 2),
		drawEdge,
		generatePath,
		fallback
	}

	if (debounceTime === 0) {
		const RegularPathFindingEdge = memo((props: EdgeProps) => {
			const storeNodes = useNodes()

			return (
				<PathFindingEdge {...props} storeNodes={storeNodes} options={options} />
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
