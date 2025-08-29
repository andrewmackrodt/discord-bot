/**
 * @type {import('prettier').Config}
 *
 * @see https://prettier.io/docs/configuration
 */
module.exports = {
    plugins: [
        'prettier-plugin-multiline-arrays', // must be listed first
        'prettier-plugin-jsdoc',
        'prettier-plugin-packagejson',
    ],
    jsdocPrintWidth: 100,
    jsdocSeparateTagGroups: true,
    multilineArraysWrapThreshold: 2,
    printWidth: 100,
    semi: false,
    singleQuote: true,
    tabWidth: 4,
    tsdoc: true,
    overrides: [
        {
            files: [
                'package.json',
                'tsconfig.json',
                'tsconfig.*.json',
                '*.yaml',
                '*.yml',
            ],
            options: {
                tabWidth: 2,
            },
        },
    ],
}
