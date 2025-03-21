import type { XYPosition } from '@xyflow/react'

/**
 * Takes source and target {x, y} points, together with an array of number
 * tuples [x, y] representing the points along the path, and returns a string
 * to be used as the SVG path.
 */
export type SVGDrawFunction = (
	source: XYPosition,
	target: XYPosition,
	path: number[][]
) => string

/**
 * Draws a SVG path from a list of points, using straight lines.
 */
export const svgDrawStraightLinePath: SVGDrawFunction = (
	source,
	target,
	path
) => {
	let svgPathString = `M ${source.x}, ${source.y} `

	path.forEach((point) => {
		const [x, y] = point
		svgPathString += `L ${x}, ${y} `
	})

	svgPathString += `L ${target.x}, ${target.y} `

	return svgPathString
}

/**
 * Draws a SVG path from a list of points, using rounded lines.
 */
export const svgDrawSmoothLinePath: SVGDrawFunction = (
	source,
	target,
	path
) => {
	const points = [[source.x, source.y], ...path, [target.x, target.y]]
	return quadraticBezierCurve(points)
}

const quadraticBezierCurve = (points: number[][]) => {
	const X = 0
	const Y = 1
	let point = points[0]

	const first = points[0]
	let svgPath = `M${first[X]},${first[Y]}M`

	for (let i = 0; i < points.length; i++) {
		const next = points[i]
		const midPoint = getMidPoint(point[X], point[Y], next[X], next[Y])

		svgPath += ` ${midPoint[X]},${midPoint[Y]}`
		svgPath += `Q${next[X]},${next[Y]}`
		point = next
	}

	const last = points[points.length - 1]
	svgPath += ` ${last[0]},${last[1]}`

	return svgPath
}

const getMidPoint = (Ax: number, Ay: number, Bx: number, By: number) => {
	const Zx = (Ax - Bx) / 2 + Bx
	const Zy = (Ay - By) / 2 + By
	return [Zx, Zy]
}
