// https://testing-library.com/docs/example-drag/
import { fireEvent } from '@storybook/testing-library'

const isElement = (obj: unknown): obj is HTMLElement => {
	if (typeof obj !== 'object') {
		return false
	}

	let prototypeStr: string
	let prototype: unknown

	do {
		prototype = Object.getPrototypeOf(obj)
		prototypeStr = Object.prototype.toString.call(prototype)
		if (
			prototypeStr === '[object Element]' ||
			prototypeStr === '[object Document]'
		) {
			return true
		}
		obj = prototype
	} while (prototype !== null)

	return false
}

const getElementClientCenter = (element: HTMLElement): Point => {
	const { left, top, width, height } = element.getBoundingClientRect()
	return {
		x: left + width / 2,
		y: top + height / 2
	}
}

const getCoords = (charlie: HTMLElement | Point) =>
	isElement(charlie) ? getElementClientCenter(charlie) : charlie

export const wait = (ms: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms)
	})

type Point = {
	x: number
	y: number
}

type DragOptions = {
	delta?: Point
	to?: HTMLElement | Point
	duration?: number
	steps?: number
}

export const SimulateDragAndDrop = async (
	element: HTMLElement,
	{ to: inTo, delta, steps = 10, duration = 200 }: DragOptions
) => {
	const from = getElementClientCenter(element)
	let to: Point

	if (delta) {
		to = {
			x: from.x + delta.x,
			y: from.y + delta.y
		}
	} else if (inTo) {
		to = getCoords(inTo)
	} else {
		throw new Error('drag requires either a delta or a to')
	}

	const step = {
		x: (to.x - from.x) / steps,
		y: (to.y - from.y) / steps
	}

	const current = {
		clientX: from.x,
		clientY: from.y
	}

	fireEvent.mouseEnter(element, current)
	fireEvent.mouseOver(element, current)
	fireEvent.mouseMove(element, current)
	fireEvent.mouseDown(element, current)

	for (let i = 0; i < steps; i++) {
		current.clientX += step.x
		current.clientY += step.y
		await wait(duration / steps)
		fireEvent.mouseMove(element, current)
	}

	fireEvent.mouseUp(element, current)
}
