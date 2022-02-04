import * as schedule from 'node-schedule'

declare module 'node-schedule' {
    function gracefulShutdown(): Promise<void>
}
