const fs = require('node:fs')
const { fileURLToPath } = require('node:url')

const { includeIgnoreFile } = require('@eslint/compat')
const js = require('@eslint/js')
const stylistic = require('@stylistic/eslint-plugin')
const tsEslint = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const eslintConfigPrettier = require('eslint-config-prettier')
const importPlugin = require('eslint-plugin-import')
const perfectionist = require('eslint-plugin-perfectionist')
const prettier = require('eslint-plugin-prettier')
const promise = require('eslint-plugin-promise')
const unusedImports = require('eslint-plugin-unused-imports')
const globals = require('globals')

const ignores = (() => {
    let { ignores } = includeIgnoreFile(
        fileURLToPath(new URL('.gitignore', `file://${__dirname}/`)),
    )
    ignores = [
        '**/.*/',
        '**/assets/',
    ]
        .concat(ignores.filter((ignore) => !ignore.match(/^(!\.|\.)/)))
        .toSorted((a, b) => a.localeCompare(b))
    return { name: 'ignores', ignores }
})()

const tsFiles = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.mts',
    '**/*.cts',
]

const configs = [
    { name: '@eslint/js/recommended', ...js.configs.recommended },
    { name: '@stylistic/eslint-plugin/recommended', ...stylistic.configs.recommended },
    ...(() => {
        const config = tsEslint.configs['flat/recommended']
        config[2].files = tsFiles
        return config
    })(),
    {
        files: tsFiles,
        ...tsEslint.configs['flat/stylistic'][2],
    },
    importPlugin.flatConfigs.recommended,
    {
        ...importPlugin.flatConfigs.typescript,
        settings: {
            ...importPlugin.flatConfigs.typescript.settings,
            'import/resolver': {
                ...importPlugin.flatConfigs.typescript.settings['import/resolver'],
                typescript: {
                    project: ['tsconfig.json'],
                },
            },
        },
    },
    promise.configs['flat/recommended'],
]

const languageOptions = {
    ecmaVersion: 2022,
    globals: {
        ...globals.node,
    },
    parser: tsParser,
    parserOptions: {
        emitDecoratorMetadata: true,
        extraFileExtensions: [
            '.js',
            '.cjs',
            '.mjs',
        ],
        projectService: {
            allowDefaultProject: ['*.config.js'],
        },
    },
}

const plugins = {
    perfectionist,
    prettier,
    'unused-imports': unusedImports,
}

const rules = {
    '@stylistic/brace-style': [
        'error',
        '1tbs',
        { allowSingleLine: true },
    ],

    '@stylistic/function-call-spacing': ['error'],

    '@stylistic/indent': [
        'error',
        4,
        { flatTernaryExpressions: true, SwitchCase: 1 },
    ],

    '@stylistic/indent-binary-ops': ['error', 4],
    '@stylistic/multiline-ternary': ['off'],
    '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
    '@stylistic/operator-linebreak': ['off'],

    '@stylistic/quotes': [
        'error',
        'single',
        { avoidEscape: true },
    ],

    '@stylistic/type-generic-spacing': ['off'],

    '@typescript-eslint/consistent-type-assertions': ['off'],
    '@typescript-eslint/consistent-type-imports': ['error'],

    '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'no-public' },
    ],

    '@typescript-eslint/no-explicit-any': ['off'],
    '@typescript-eslint/no-inferrable-types': ['error'],
    '@typescript-eslint/no-this-alias': ['off'],

    '@typescript-eslint/no-unused-vars': [
        'warn',
        {
            argsIgnorePattern: /^(_.*|args|descriptor|param(eter)?s)$/.toString().slice(1, -1),
            destructuredArrayIgnorePattern: '^(_.*|[a-z])$',
        },
    ],

    // '@typescript-eslint/return-await': ['error', 'always'],

    'import/enforce-node-protocol-usage': ['error', 'always'],
    'import/newline-after-import': ['error', { count: 1 }],
    'import/no-named-as-default-member': ['off'],

    'import/order': [
        'error',
        {
            alphabetize: {
                caseInsensitive: true,
                order: 'asc',
            },
            groups: [
                'builtin',
                'external',
                [
                    'parent',
                    'sibling',
                    'index',
                ],
            ],
            'newlines-between': 'always',
        },
    ],

    'no-constant-condition': ['error', { checkLoops: false }],
    'object-shorthand': ['error', 'always'],
    'perfectionist/sort-array-includes': ['error'],

    'perfectionist/sort-classes': [
        'error',
        {
            groups: [
                'index-signature',
                ['static-property', 'static-accessor-property'],
                ['protected-static-property', 'protected-static-accessor-property'],
                ['private-static-property', 'private-static-accessor-property'],
                'static-block',
                ['static-method', 'static-function-property'],
                ['protected-static-method', 'protected-static-function-property'],
                ['private-static-method', 'private-static-function-property'],
                ['readonly-property', 'readonly-accessor-property'],
                ['readonly-protected-property', 'readonly-protected-accessor-property'],
                ['readonly-private-property', 'readonly-private-accessor-property'],
                ['property', 'accessor-property'],
                ['protected-property', 'protected-accessor-property'],
                ['private-property', 'private-accessor-property'],
                ['static-get-method', 'static-set-method'],
                ['protected-static-get-method', 'protected-static-set-method'],
                ['private-static-get-method', 'private-static-set-method'],
                'constructor',
                ['get-method', 'set-method'],
                ['protected-get-method', 'protected-set-method'],
                ['private-get-method', 'private-set-method'],
                ['method', 'function-property'],
                ['protected-method', 'protected-function-property'],
                ['private-method', 'private-function-property'],
                'unknown',
            ],
            type: 'unsorted',
        },
    ],

    'perfectionist/sort-modules': ['error', { type: 'unsorted' }],
    'perfectionist/sort-named-exports': ['error'],
    'perfectionist/sort-named-imports': ['error'],
    'perfectionist/sort-switch-case': ['error'],

    'prefer-const': ['error', { destructuring: 'all' }],

    'prettier/prettier': ['error', { usePrettierrc: true }],
    'unused-imports/no-unused-imports': ['error'],
}

const { name } = JSON.parse(
    fs.readFileSync(fileURLToPath(new URL('package.json', `file://${__dirname}/`)), 'utf-8'),
)

const config = {
    name,
    languageOptions,
    plugins,
    rules,
}

const prettierEslintDisable = {
    name: 'prettier-eslint-disable',
    rules: Object.fromEntries(
        Object.entries(eslintConfigPrettier.rules)
            .filter(([name]) => name.includes('/') && !name.startsWith('@typescript-eslint/'))
            .map(([name, value]) => {
                if (name.match(/^@stylistic\/[jt]sx?\//)) {
                    name = '@stylistic/' + name.split('/').slice(2).join('/')
                }
                return [name, value]
            }),
    ),
}

module.exports = [
    ignores,
    ...configs,
    config,
    prettierEslintDisable,
]
