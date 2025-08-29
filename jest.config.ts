import type { Config } from '@jest/types'

const jestConfig: Config.InitialOptions = {
    collectCoverageFrom: ['src/**/*.ts'],
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
    roots: ['<rootDir>/src'],
    setupFilesAfterEnv: ['./jest.setup.ts'],
    testEnvironment: 'node',
    transform: {
        '^.+\\.(t|j)sx?$': [
            '@swc/jest',
            {
                jsc: {
                    parser: {
                        decorators: true,
                        syntax: 'typescript',
                    },
                    transform: {
                        decoratorMetadata: true,
                    },
                },
            },
        ],
    },
}

module.exports = jestConfig
