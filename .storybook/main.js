module.exports = {
	stories: ['../src/stories/**/*.stories.@(ts|tsx|js|jsx)'],
	addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
	typescript: {
		check: true
	},
	core: {
		builder: 'webpack5'
	}
}
