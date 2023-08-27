import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DataSource } from 'typeorm'
import { AbstractLogger } from 'typeorm/logger/AbstractLogger'
import { sqliteConnectionOptions } from './db'

const ddlRegExp = /^(insert|update|delete|create|alter|drop)/i

describe('DataSource', () => {
    let dataSource: DataSource
    let database: string

    beforeEach(async () => {
        const options = Object.assign({}, sqliteConnectionOptions)
        dataSource = new DataSource(options)
        database = path.join(os.tmpdir(), `migration_${Date.now()}.db`)
        dataSource.setOptions({ database, logging: false })
        await dataSource.initialize()
    })

    afterEach(async () => {
        const exists = await fs.stat(database).catch(err => console.error(err))
        if (exists) {
            await fs.unlink(database).catch(err => console.error(err))
        }
    })

    it('synchronize() produces no changes after initial migration', async () => {
        expect.assertions(1)
        await dataSource.runMigrations()
        let isSchemaChanges = false
        dataSource.setOptions({
            logger: new class extends AbstractLogger {
                protected writeLog(): void {}
                public logQuery(query: string, parameters?: any[]) {
                    if (ddlRegExp.exec(query) != null) {
                        isSchemaChanges = true
                    }
                }
            },
            logging: true,
        })
        await dataSource.synchronize()
        expect(isSchemaChanges).toEqual(false)
    })
})
