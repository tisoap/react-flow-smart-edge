module.exports = {
	parserOptions: {
		project: ['./tsconfig.json']
	},
	plugins: ['prettier', 'storybook'],
	extends: [
		'@tisoap/eslint-config-ts-react',
		'plugin:prettier/recommended',
		'plugin:storybook/recommended'
	],
	rules: {
		'prettier/prettier': ['error', {}, { usePrettierrc: true }]
	}
}
