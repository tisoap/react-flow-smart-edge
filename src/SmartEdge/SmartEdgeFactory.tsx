import React, { memo, useState } from 'react'
import { useNodes, BezierEdge } from 'react-flow-renderer'
import useDebounce from 'react-use/lib/useDebounce'
import { drawSmoothLinePath } from '../functions'
import { PathFindingEdge } from './PathFindingEdge'
import type { SmartEdgeOptions } from './PathFindingEdge'
import type { EdgeProps } from 'react-flow-renderer'

export type { SmartEdgeOptions }

export const SmartEdgeFactory = ({
	debounceTime = 200,
	nodePadding = 10,
	gridRatio = 10,
	drawEdge = drawSmoothLinePath,
	lessCorners = false,
	fallback = BezierEdge
}: Partial<SmartEdgeOptions>) => {
	const options: SmartEdgeOptions = {
		debounceTime,
		nodePadding,
		gridRatio,
		drawEdge,
		lessCorners,
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
