import 'reflect-metadata'

import { Client } from './src/Client'
import { Plugin } from './types/plugins'
import dotenv from 'dotenv'
import { glob } from 'glob'
import path from 'path'

dotenv.config()

function requirePlugins(): Plugin[] {
    const plugins: Plugin[] = []
    const isTs = Boolean(process.env.TS_NODE_DEV || (<any>process)[Symbol.for('ts-node.register.instance')])
    const ext = isTs ? 'ts' : 'js'
    const pluginsPath = path.resolve(__dirname, 'src/plugins')

    glob.sync(`${pluginsPath}/*/index.${ext}`).map(filepath => {
        const pathname = filepath.replace(/\.[jt]s$/, '')

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        let plugin = require(pathname).default

        if (typeof plugin.prototype?.constructor) {
            plugin = new plugin()
        }

        plugins.push(plugin)
    })

    return plugins
}

const token: string | undefined = process.env.DISCORD_TOKEN

if ( ! token || token.length === 0) {
    console.error('Missing environment variable: DISCORD_TOKEN')
    process.exit(1)
}

const plugins = requirePlugins()
const client = new Client(token, plugins)

void client.start()
