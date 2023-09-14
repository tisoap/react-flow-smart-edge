module.exports = {
	stories: ['../src/stories/**/*.stories.@(ts|tsx|js|jsx)'],
	addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
	typescript: {
		check: true
	},
	docs: {
		autodocs: true
	},
	framework: {
		name: "@storybook/react-webpack5",
		options: {}
	},
	core: {
		disableWhatsNewNotifications: true
	}
}
