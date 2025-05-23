// curl -s https://www.gov.uk/bank-holidays.json | jq -r '.["england-and-wales"].events[] | "\"\(.date)\", // \(.title)"' | grep 202 | sed 's/"'"/'/g"
export const bankHolidays = [
    '2024-12-25', // Christmas Day
    '2024-12-26', // Boxing Day
    '2025-01-01', // New Year’s Day
    '2025-04-18', // Good Friday
    '2025-04-21', // Easter Monday
    '2025-05-05', // Early May bank holiday
    '2025-05-26', // Spring bank holiday
    '2025-08-25', // Summer bank holiday
    '2025-12-25', // Christmas Day
    '2025-12-26', // Boxing Day
    '2026-01-01', // New Year’s Day
    '2026-04-03', // Good Friday
    '2026-04-06', // Easter Monday
    '2026-05-04', // Early May bank holiday
    '2026-05-25', // Spring bank holiday
    '2026-08-31', // Summer bank holiday
    '2026-12-25', // Christmas Day
    '2026-12-28', // Boxing Day
    '2027-01-01', // New Year’s Day
    '2027-03-26', // Good Friday
    '2027-03-29', // Easter Monday
    '2027-05-03', // Early May bank holiday
    '2027-05-31', // Spring bank holiday
    '2027-08-30', // Summer bank holiday
    '2027-12-27', // Christmas Day
    '2027-12-28', // Boxing Day
]

export function getYmd(date: Date | string = new Date()): string {
    if (typeof date === 'string') {
        date = new Date(date)
    }

    return date.toISOString().split('T')[0]
}

export function isWorkingDay(date: Date = new Date()): boolean {
    return date.getDay() !== 0 && date.getDay() !== 6 &&
        ! bankHolidays.includes(getYmd(date))
}

export function getDaysBetween(date1: Date | string, date2: Date | string): number {
    if (typeof date1 === 'string') {
        date1 = new Date(date1)
    }

    if (typeof date2 === 'string') {
        date2 = new Date(date2)
    }

    const diffTime = Math.abs(date1.getTime() - date2.getTime())

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getNextWorkingDays(from: Date | string, count: number): string[] {
    const fromDate = new Date(from)

    if (isNaN(fromDate.getTime())) {
        throw new Error()
    }

    const fromDateYmd = getYmd(fromDate)
    const workingDays: string[] = []

    for (
        let day = new Date(fromDateYmd);
        workingDays.length < count;
        day.setDate(day.getDate() + 1)
    ) {
        if (isWorkingDay(day)) {
            workingDays.push(getYmd(day))
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

    const fromDateYmd = getYmd(fromDate)
    const toDateYmd = getYmd(toDate)
    const workingDays: string[] = []

    for (
        let day = new Date(fromDateYmd), lastDay = new Date(toDateYmd);
        day < lastDay;
        day.setDate(day.getDate() + 1)
    ) {
        if (isWorkingDay(day)) {
            workingDays.push(getYmd(day))
        }
    }

    return workingDays
}
