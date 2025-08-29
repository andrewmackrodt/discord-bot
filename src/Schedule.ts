import type { Job, RecurrenceRule } from 'node-schedule'
import { gracefulShutdown, scheduleJob } from 'node-schedule'

export class Schedule {
    protected readonly jobs: Job[] = []

    add(rule: RecurrenceRule | string, callback: () => void | Promise<void>) {
        const job = scheduleJob(rule, callback)

        this.jobs.push(job)
    }

    async shutdown() {
        await gracefulShutdown()
    }
}
