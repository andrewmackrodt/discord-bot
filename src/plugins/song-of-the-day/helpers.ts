import type { ButtonInteraction, Channel } from 'discord.js'
import { ChannelType } from 'discord.js'
import type { SongOfTheDayRepository } from './repositories/SongOfTheDayRepository'

const trackIdRegExp = new RegExp(/\bspotify.com\/track\/([A-Za-z0-9_-]{10,})\b|^([A-Za-z0-9_-]{10,})$/)

export function extractTrackId(url: string): string | null {
    const match = trackIdRegExp.exec(url)
    return match ? (match[1] ?? match[2]) : null
}

export interface PaginatedOptionalUserQuery {
    page?: number
    userId?: string
}

export async function lookupUserId(
    channel: Channel,
    nameOrMention: string,
    repository: SongOfTheDayRepository,
) : Promise<string | undefined> {
    if (channel.type !== ChannelType.GuildText) {
        return
    }

    const userIdMentionMatch = nameOrMention.match(/^<@!([0-9]+)>$/)

    if (userIdMentionMatch) {
        return userIdMentionMatch[1]
    }

    const member = channel.members.find(m => (
        m.user.username.localeCompare(nameOrMention, undefined, { sensitivity: 'base' }) === 0
    ))

    if (member) {
        return member.id
    }

    const user = await repository.getUserByName(nameOrMention)

    if (user) {
        return user.id
    }
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
