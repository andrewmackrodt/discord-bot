const trackIdRegExp = new RegExp(
    /\bspotify.com\/track\/([A-Za-z0-9_-]{10,})\b|^([A-Za-z0-9_-]{10,})$/,
)

export interface PaginatedOptionalUserQuery {
    page?: number
    userId?: string
}

export function extractTrackId(url: string): string | null {
    const match = trackIdRegExp.exec(url)
    return match ? (match[1] ?? match[2]) : null
}
