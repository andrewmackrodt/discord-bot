import path from 'node:path'

import { DataSource } from 'typeorm'
import type { BetterSqlite3ConnectionOptions } from 'typeorm/driver/better-sqlite3/BetterSqlite3ConnectionOptions'

const appDir = path.dirname(__dirname)
const srcDir = __dirname
const isTs = Boolean(
    process.env.TS_NODE_DEV || (process as any)[Symbol.for('ts-node.register.instance')],
)
const ext = isTs ? 'ts' : 'js'

export const sqliteConnectionOptions: BetterSqlite3ConnectionOptions = {
    type: 'better-sqlite3',
    database: `${appDir}/config/bot.db`,
    synchronize: false,
    logging: false,
    entities: [
        `${srcDir}/models/**/*.${ext}`,
        `${srcDir}/plugins/*/models/**/*.${ext}`,
    ],
    migrations: [
        `${srcDir}/migrations/**/*.${ext}`,
        `${srcDir}/plugins/*/migrations/**/*.${ext}`,
    ],
    subscribers: [
        `${srcDir}/subscribers/**/*.${ext}`,
        `${srcDir}/plugins/*/subscribers/**/*.${ext}`,
    ],
}

export const dataSource = new DataSource(sqliteConnectionOptions)
