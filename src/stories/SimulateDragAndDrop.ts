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
}

export const SimulateDragAndDrop = (
	element: HTMLElement,
	{ to: inTo, delta }: DragOptions
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

	const fromOptions = {
		clientX: from.x,
		clientY: from.y,
		view: window
	}

	const toOptions = {
		clientX: to.x,
		clientY: to.y,
		view: window
	}

	fireEvent.mouseEnter(element, fromOptions)
	fireEvent.mouseOver(element, fromOptions)
	fireEvent.mouseMove(element, fromOptions)
	fireEvent.mouseDown(element, fromOptions)
	fireEvent.mouseMove(element, toOptions)
	fireEvent.mouseUp(element, toOptions)
}
