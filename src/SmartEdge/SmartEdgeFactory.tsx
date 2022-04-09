import React, { memo, useState } from 'react'
import { useNodes } from 'react-flow-renderer'
import useDebounce from 'react-use/lib/useDebounce'
import { PathFindingEdge } from './PathFindingEdge'
import type { SmartEdgeOptions } from './PathFindingEdge'
import type { EdgeProps } from 'react-flow-renderer'

export type { SmartEdgeOptions }

export const SmartEdgeFactory = ({
	debounceTime = 200,
	nodePadding = 10,
	gridRatio = 10,
	lineType = 'curve',
	lessCorners = false
}: Partial<SmartEdgeOptions>) => {
	const options: SmartEdgeOptions = {
		debounceTime,
		nodePadding,
		gridRatio,
		lineType,
		lessCorners
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
