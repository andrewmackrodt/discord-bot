import { mkdirSync } from 'node:fs'

import { copySync } from 'fs-extra'
import { glob } from 'glob'
import { exec } from 'shelljs'

const distPath = `${__dirname}/out`

// prettier-ignore
exec(['tsc',
        '--project', 'tsconfig.build.json',
        '--sourcemap',
        '--outDir', `"${distPath}/"`,
    ].join(' '),
    {
        fatal: true,
    })
// prettier-enable

glob.sync(`${__dirname}/src/plugins/*/assets`).map((filepath) => {
    const dest = `${distPath}/` + filepath.split('/').slice(-4).join('/')
    mkdirSync(dest)
    copySync(filepath, dest)
})
