import { copySync } from 'fs-extra'
import { exec } from 'shelljs'
import { glob } from 'glob'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'

const distPath = `${__dirname}/dist`

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

for (const filename of [
    'ormconfig.json',
    'package.json',
    'package-lock.json',
]) {
    copySync(`${__dirname}/${filename}`, `${distPath}/${filename}`)
}

const packageJsonFilepath = `${distPath}/package.json`
const packageJson = JSON.parse(readFileSync(packageJsonFilepath).toString('utf8'))
packageJson.scripts = { start: 'node index' }
delete packageJson.devDependencies
writeFileSync(packageJsonFilepath, JSON.stringify(packageJson, null, 2))

exec(['npm', 'i',
        '--silent',
        '--no-progress',
        '--package-lock-only',
        `--prefix="${distPath}/"`,
    ].join(' '),
    {
        fatal: true,
    })
