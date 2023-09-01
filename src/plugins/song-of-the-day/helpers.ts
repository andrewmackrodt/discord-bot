import type { ButtonInteraction } from 'discord.js'

const trackIdRegExp = new RegExp(/\bspotify.com\/track\/([A-Za-z0-9_-]{10,})\b|^([A-Za-z0-9_-]{10,})$/)

export function extractTrackId(url: string): string | null {
    const match = trackIdRegExp.exec(url)
    return match ? (match[1] ?? match[2]) : null
}

export interface PaginatedOptionalUserQuery {
    page?: number
    userId?: string
}

export async function suppressInteractionReply(interaction: ButtonInteraction) {
    try {
        await interaction.reply({ content: '', ephemeral: true })
    } catch (err) {
        // the discord api requires sending a non-empty reply to interactions
        // rather than deferReplay then deleteReplay which would create a new
        // message in the channel, we submit a bad request and hide the error
    }
}
