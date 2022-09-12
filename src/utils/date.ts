// curl -s https://www.gov.uk/bank-holidays.json | jq -r '.["england-and-wales"].events[] | "\"\(.date)\", // \(.title)"' | grep 202 | sed 's/"'"/'/g"
export const bankHolidays = [
    '2022-09-19', // Bank Holiday for the State Funeral of Queen Elizabeth II
    '2022-12-26', // Boxing Day
    '2022-12-27', // Christmas Day
    '2023-01-02', // New Year’s Day
    '2023-04-07', // Good Friday
    '2023-04-10', // Easter Monday
    '2023-05-01', // Early May bank holiday
    '2023-05-29', // Spring bank holiday
    '2023-08-28', // Summer bank holiday
    '2023-12-25', // Christmas Day
    '2023-12-26', // Boxing Day
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
