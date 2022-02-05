export const bankHolidays = [
    '2022-01-03',
    '2022-04-15',
    '2022-04-18',
    '2022-05-02',
    '2022-06-03',
    '2022-08-29',
    '2022-12-26',
    '2022-12-27',
]

export function ymd(date: Date | string = new Date()): string {
    if (typeof date === 'string') {
        date = new Date(date)
    }

    return date.toISOString().split('T')[0]
}

export function isWorkingDay(date: Date = new Date()): boolean {
    return date.getDay() !== 0 && date.getDay() !== 6 &&
        ! bankHolidays.includes(ymd(date))
}

export function getNextWorkingDays(from: Date | string, count: number): string[] {
    const fromDate = new Date(from)

    if (isNaN(fromDate.getTime())) {
        throw new Error()
    }

    const fromDateYmd = ymd(fromDate)
    const workingDays: string[] = []

    for (
        let day = new Date(fromDateYmd);
        workingDays.length < count;
        day.setDate(day.getDate() + 1)
    ) {
        if (isWorkingDay(day)) {
            workingDays.push(ymd(day))
        }
    }

    return workingDays
}

export function getWorkingDaysBetween(from: Date | string, to: Date | string): string[] {
    const fromDate = new Date(from)
    const toDate = new Date(to)

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate > toDate) {
        throw new Error()
    }

    const fromDateYmd = ymd(fromDate)
    const toDateYmd = ymd(toDate)
    const workingDays: string[] = []

    for (
        let day = new Date(fromDateYmd), lastDay = new Date(toDateYmd);
        day < lastDay;
        day.setDate(day.getDate() + 1)
    ) {
        if (isWorkingDay(day)) {
            workingDays.push(ymd(day))
        }
    }

    return workingDays
}
