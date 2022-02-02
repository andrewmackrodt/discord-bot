type Column = string | number | null

export function padLeft(text: string, len: number): string {
    const padLen = len - text.length
    const pad = new Array(padLen).fill(' ').join('')

    return `${pad}${text}`
}

export function padRight(text: string, len: number): string {
    const padLen = len - text.length
    const pad = new Array(padLen).fill(' ').join('')

    return `${text}${pad}`
}

function toMarkdownRow(cols: string[]) {
    return '| ' + cols.join(' | ') + ' |'
}

export function toMarkdownTable(rows: Record<string, Column>[]): string | undefined {
    if (rows.length === 0) {
        return
    }

    const headers = Object.keys(rows[0])
    const maxLen = headers.map(header => header.length)

    for (const row of rows) {
        const values = Object.values(row)

        for (let i = 0; i < values.length; i++) {
            const str = typeof values[i] === 'number' ? values[i]!.toString(10) :
                values[i] === null ? '' :
                values[i]!.toString()

            maxLen[i] = Math.max(maxLen[i], str.length)
        }
    }

    const markdown = rows.map(row => {
        const values = Object.values(row)
        const cols: string[] = []

        for (let i = 0; i < values.length; i++) {
            const value = values[i]

            if (typeof value === 'number') {
                cols.push(padLeft(value.toString(10), maxLen[i]))
            } else if (value === null) {
                cols.push(padRight('', maxLen[i]))
            } else {
                cols.push(padRight(value.toString(), maxLen[i]))
            }
        }

        return toMarkdownRow(cols)
    })

    markdown.unshift(toMarkdownRow(headers.map((header, i) => new Array(maxLen[i]).fill('-').join(''))))
    markdown.unshift(toMarkdownRow(headers.map((header, i) => padRight(header, maxLen[i]))))

    return markdown.join('\n')
}
