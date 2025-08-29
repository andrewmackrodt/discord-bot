import 'reflect-metadata'

import { existsSync } from 'node:fs'
import path from 'node:path'

import dotenv from 'dotenv'
import { glob } from 'glob'
import { container } from 'tsyringe'

import { Client } from './src/Client'
import type { Plugin } from './types/plugins'

dotenv.config({ quiet: true })

function requirePlugins(): Plugin[] {
    const plugins: Plugin[] = []
    const isTs = Boolean(
        process.env.TS_NODE_DEV || (process as any)[Symbol.for('ts-node.register.instance')],
    )
    const ext = isTs ? 'ts' : 'js'
    const pluginsPath = path.resolve(__dirname, 'src/plugins')

    /* eslint-disable @typescript-eslint/no-require-imports */
    glob.sync(`${pluginsPath}/*/index.${ext}`).map((filepath) => {
        const augmentsFilepath = path.join(path.dirname(filepath), `augments.${ext}`)

        if (existsSync(augmentsFilepath)) {
            require(augmentsFilepath)
        }

        let plugin = require(filepath).default

        if (typeof plugin.prototype?.constructor === 'function') {
            plugin = container.resolve(plugin)
        }

        plugins.push(plugin)
    })
    /* eslint-enable @typescript-eslint/no-require-imports */

    return plugins
}

const token: string | undefined = process.env.DISCORD_TOKEN

if (!token || token.length === 0) {
    console.error('Missing environment variable: DISCORD_TOKEN')
    process.exit(1)
}

const plugins = requirePlugins()
const client = new Client(token, plugins)

void client.start()
