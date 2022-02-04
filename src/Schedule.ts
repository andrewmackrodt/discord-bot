import { Job, RecurrenceRule, gracefulShutdown, scheduleJob } from 'node-schedule'

export class Schedule {
    protected readonly jobs: Job[] = []

    public add(rule: RecurrenceRule | string, callback: () => Promise<void>) {
        const job = scheduleJob(rule, callback)

        this.jobs.push(job)
    }

    public async shutdown() {
        await gracefulShutdown()
    }
}
