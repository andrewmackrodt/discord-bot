/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable quote-props */
const { fixupConfigRules, fixupPluginRules } = require('@eslint/compat')
const { FlatCompat } = require('@eslint/eslintrc')
const js = require('@eslint/js')
const stylisticEslintPlugin = require('@stylistic/eslint-plugin')
const typescriptEslint = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const _import = require('eslint-plugin-import')
const unusedImports = require('eslint-plugin-unused-imports')

const compat = new FlatCompat({
    'baseDirectory': __dirname,
    'allConfig': js.configs.all,
    'recommendedConfig': js.configs.recommended,
})

module.exports = [...fixupConfigRules(compat.extends(
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
)), {
    'plugins': {
        '@typescript-eslint': fixupPluginRules(typescriptEslint),
        '@stylistic/ts': stylisticEslintPlugin,
        'import': fixupPluginRules(_import),
        'unused-imports': unusedImports,
    },

    'languageOptions': {
        'parser': tsParser,
        'ecmaVersion': 2022,
        'sourceType': 'commonjs',

        'parserOptions': {
            'projectService': {
                'allowDefaultProject': ['eslint.config.js'],
            },
        },
    },

    'rules': {
        'comma-dangle': ['error', 'always-multiline'],
        'eol-last': ['error'],

        'import/newline-after-import': ['error', {
            'count': 1,
        }],

        'import/order': ['error', {
            'alphabetize': {
                'caseInsensitive': true,
                'order': 'asc',
            },

            'groups': ['builtin', 'external', ['parent', 'sibling', 'index']],
            'newlines-between': 'never',
        }],

        'no-trailing-spaces': ['error'],
        'object-curly-spacing': ['error', 'always'],

        'prefer-const': ['error', {
            'destructuring': 'all',
        }],

        'quote-props': ['error', 'as-needed'],

        'quotes': ['error', 'single', {
            'avoidEscape': true,
        }],

        'space-infix-ops': ['error'],

        'space-unary-ops': ['error', {
            'overrides': {
                '!': true,
            },
        }],

        'unused-imports/no-unused-imports': ['error'],

        '@stylistic/ts/member-delimiter-style': ['error', {
            'multiline': {
                'delimiter': 'none',
            },
        }],

        '@stylistic/ts/semi': ['error', 'never'],
        '@typescript-eslint/consistent-type-imports': ['error'],
        '@typescript-eslint/no-explicit-any': ['off'],
        '@typescript-eslint/no-unused-vars': ['off'],
    },
}]
