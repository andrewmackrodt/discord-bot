import type { Interaction, Message, MessageEditOptions, TextChannel } from 'discord.js'
import { injectable } from 'tsyringe'

import { AbstractSongOfTheDayHistoryCommand } from './AbstractSongOfTheDayHistoryCommand'
import { command } from '../../../utils/command'
import { interaction } from '../../../utils/interaction'
import type { PaginatedOptionalUserQuery } from '../helpers'
import { SongOfTheDayRepository } from '../repositories/SongOfTheDayRepository'

enum Interactions {
    NominationsNext = 'sotd.nominations.next',
    NominationsPrev = 'sotd.nominations.prev',
}

const DEFAULT_LIMIT = 5

@injectable()
export default class SongOfTheDayNominationsCommand extends AbstractSongOfTheDayHistoryCommand {
    constructor(protected readonly repository: SongOfTheDayRepository) {
        super(repository)
    }

    protected get nextInteractionCustomId(): string {
        return Interactions.NominationsNext
    }

    protected get prevInteractionCustomId(): string {
        return Interactions.NominationsPrev
    }

    @command('sotd nominations', {
        description: 'Show song of the day nomination history.',
        args: {
            username: {},
        },
    })
    async nominations(message: Message<true>, userId?: string): Promise<Message> {
        return this.sendInitialHistoryMessage(message, userId)
    }

    @interaction(Interactions.NominationsNext)
    @interaction(Interactions.NominationsPrev)
    async changePageInteraction(interaction: Interaction): Promise<void> {
        return this._changePageInteraction(interaction)
    }

    protected async getMessageEmbeds(
        channel: TextChannel,
        options?: PaginatedOptionalUserQuery,
    ): Promise<Pick<MessageEditOptions, 'embeds'> | undefined> {
        const page = options?.page ?? 1
        const offset = (page - 1) * DEFAULT_LIMIT

        const rows = await this.repository.getServerNominationHistory({
            serverId: channel.guildId,
            userId: options?.userId,
            limit: DEFAULT_LIMIT,
            offset,
        })

        if (rows.length === 0) {
            return
        }

        const index = 1 + (page - 1) * DEFAULT_LIMIT

        return {
            embeds: [
                {
                    title: ':notepad_spiral: **Song of the Day Nominations History**',
                    description: JSON.stringify(options)
                        .replace(/["{}]/g, '')
                        .replace(/:/g, ': ')
                        .replace(/,/g, ' | '),
                    fields: rows
                        .map((row, i) => [
                            {
                                name: '#',
                                value: (index + i).toString(10),
                                inline: true,
                            },
                            {
                                name: 'date',
                                value: row.date,
                                inline: true,
                            },
                            {
                                name: 'username',
                                value:
                                    (row.user_id
                                        ? channel.members.get(row.user_id)?.displayName
                                        : undefined) ?? row.username,
                                inline: true,
                            },
                        ])
                        .flat(),
                },
            ],
        }
    }
}
