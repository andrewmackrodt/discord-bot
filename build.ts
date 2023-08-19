import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { copySync } from 'fs-extra'
import { glob } from 'glob'
import { exec } from 'shelljs'

const distPath = `${__dirname}/out`

exec(['tsc',
        '--sourcemap',
        '--outDir',
        `"${distPath}/"`,
    ].join(' '),
    {
        fatal: true,
    })

glob.sync(`${__dirname}/src/plugins/*/assets`).map(filepath => {
    const dest = `${distPath}/` + filepath.split('/').slice(-4).join('/')
    mkdirSync(dest)
    copySync(filepath, dest)
})

const packageJsonFilepath = `${distPath}/package.json`
const packageLockFilepath = `${distPath}/package-lock.json`
let packageLockExists = existsSync(packageLockFilepath)

// don't regenerate package.json and package-lock.json if they already exist
// e.g. during docker build
if ( ! existsSync(packageJsonFilepath)) {
    const packageJson = JSON.parse(readFileSync(`${__dirname}/package.json`).toString('utf8'))
    packageJson.scripts = {
        typeorm: 'typeorm -d src/db.js',
        start: 'node index.js',
    }
    delete packageJson.devDependencies
    writeFileSync(packageJsonFilepath, JSON.stringify(packageJson, null, 2))
    packageLockExists = false
}

if ( ! packageLockExists) {
    exec(['npm', 'i',
            '--silent',
            '--no-progress',
            '--omit=dev',
            '--package-lock-only',
            `--prefix="${distPath}/"`,
        ].join(' '),
        {
            fatal: true,
        })
}
