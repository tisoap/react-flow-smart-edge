import React, { memo, useState } from 'react'
import { useNodes, BezierEdge } from 'react-flow-renderer'
import useDebounce from 'react-use/lib/useDebounce'
import { svgDrawSmoothLinePath, pathfindingAStarDiagonal } from '../functions'
import { PathFindingEdge } from './PathFindingEdge'
import type {
	SmartEdgeOptions,
	SmartEdgeAdvancedOptions
} from './PathFindingEdge'
import type { EdgeProps } from 'react-flow-renderer'

export type { SmartEdgeOptions, SmartEdgeAdvancedOptions }

export const smartEdgeFactory = ({
	debounceTime = 200,
	nodePadding = 10,
	gridRatio = 10,
	drawEdge = svgDrawSmoothLinePath,
	generatePath = pathfindingAStarDiagonal,
	fallback = BezierEdge
}: Partial<SmartEdgeAdvancedOptions>) => {
	const options: SmartEdgeAdvancedOptions = {
		debounceTime,
		nodePadding,
		gridRatio,
		drawEdge,
		generatePath,
		fallback
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
