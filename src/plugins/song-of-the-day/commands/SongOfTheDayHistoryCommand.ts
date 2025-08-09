import type { MessageEditOptions, TextChannel , Interaction, Message } from 'discord.js'
import { injectable } from 'tsyringe'
import { AbstractSongOfTheDayHistoryCommand } from './AbstractSongOfTheDayHistoryCommand'
import { command } from '../../../utils/command'
import { getDaysBetween } from '../../../utils/date'
import { interaction } from '../../../utils/interaction'
import type { PaginatedOptionalUserQuery } from '../helpers'
import { SongOfTheDayRepository } from '../repositories/SongOfTheDayRepository'

enum Interactions {
    HistoryNext = 'sotd.history.next',
    HistoryPrev = 'sotd.history.prev',
}

const DEFAULT_LIMIT = 5

@injectable()
export default class SongOfTheDayHistoryCommand extends AbstractSongOfTheDayHistoryCommand {
    protected get nextInteractionCustomId(): string { return Interactions.HistoryNext }
    protected get prevInteractionCustomId(): string { return Interactions.HistoryPrev }

    public constructor(
        protected readonly repository: SongOfTheDayRepository,
    ) {
        super(repository)
    }

    @command('sotd history', {
        description: 'Show song of the day history.',
        args: {
            username: {},
        },
    })
    public async history(message: Message<true>, userId?: string): Promise<Message> {
        return this.sendInitialHistoryMessage(message, userId)
    }

    @interaction(Interactions.HistoryNext)
    @interaction(Interactions.HistoryPrev)
    public async changePageInteraction(interaction: Interaction): Promise<void> {
        return this._changePageInteraction(interaction)
    }

    protected async getMessageEmbeds(
        channel: TextChannel,
        options?: PaginatedOptionalUserQuery,
    ): Promise<Pick<MessageEditOptions, 'embeds'> | undefined> {
        const page = options?.page ?? 1
        const offset = (page - 1) * DEFAULT_LIMIT

        const rows = await this.repository.getServerHistory({
            serverId: channel.guildId,
            userId: options?.userId,
            limit: DEFAULT_LIMIT,
            offset,
        })

        if (rows.length === 0) {
            return
        }

        const index = 1 + ((page - 1) * DEFAULT_LIMIT)

        return {
            embeds: [{
                title: ':notepad_spiral: **Song of the Day History**',
                description: JSON.stringify(options).replace(/["{}]/g, '').replace(/:/g, ': ').replace(/,/g, ' | '),
                fields: rows.map((row, i) => {
                    const author = (
                        row.author_id
                            ? channel.members.get(row.author_id)?.displayName
                            : undefined
                        )
                        ?? row.author

                    let playcountIsEstimate = false
                    let playcount = row.playcount

                    if (row.playcount && row.playcount_updated_at && row.release_date) {
                        const playCountUpdatedDate = row.playcount_updated_at.split(' ')[0]
                        const daysBetweenRelease = getDaysBetween(playCountUpdatedDate, row.release_date.toString())
                        const ppd = row.playcount / daysBetweenRelease
                        const daysBetweenAdded = getDaysBetween(playCountUpdatedDate, row.date)
                        const delta = Math.round(ppd * daysBetweenAdded)
                        playcountIsEstimate = delta !== 0
                        playcount = row.playcount - delta
                    }

                    let playcountStr = ''

                    if (playcount) {
                        playcountStr = playcount.toLocaleString()
                        if (playcountIsEstimate) {
                            playcountStr = '~' + playcountStr
                        }
                        playcountStr = ` (${playcountStr} plays)`
                    }

                    return [
                        {
                            name: '#',
                            value: (index + i).toString(10),
                            inline: true,
                        },
                        {
                            name: `${row.artist} - ${row.title}${playcountStr}`,
                            value: `https://open.spotify.com/track/${row.track_id}`,
                            inline: true,
                        },
                        {
                            name: `added by ${author}`,
                            value: `on ${row.date}`,
                            inline: true,
                        },
                    ]
                }).flat(),
            }],
        }
    }
}
