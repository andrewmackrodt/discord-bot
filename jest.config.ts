import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
    collectCoverageFrom: [
        'src/**/*.ts',
    ],
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
    roots: [
        '<rootDir>/src',
    ],
    setupFiles: [
        './jest.setup.ts',
    ],
    testEnvironment: 'node',
    transform: {
        '.+\.tsx?$': ['ts-jest', {}],
    },
}

export default jestConfig
