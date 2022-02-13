import React from 'react'
import * as ReactDOM from 'react-dom'
import { DefaultExample as Graph } from '../stories/SmartEdge/SmartEdge.stories'
import { data } from '../stories/SmartEdge/dummyData'

describe('Graph with Smart Edge', () => {
	it('renders without crashing', () => {
		const div = document.createElement('div')
		ReactDOM.render(<Graph elements={data} />, div)
	})
})
