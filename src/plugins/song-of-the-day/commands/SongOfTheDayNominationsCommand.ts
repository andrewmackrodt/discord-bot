import type { MessageEditOptions } from 'discord.js'
import { Interaction, Message } from 'discord.js'
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
    protected get nextInteractionCustomId(): string { return Interactions.NominationsNext }
    protected get prevInteractionCustomId(): string { return Interactions.NominationsPrev }

    public constructor(
        protected readonly repository: SongOfTheDayRepository,
    ) {
        super(repository)
    }

    @command('sotd nominations', {
        description: 'show song of the day nomination history',
        args: {
            username: {},
        },
    })
    public async nominations(message: Message, userId?: string): Promise<Message> {
        return this.sendInitialHistoryMessage(message, userId)
    }

    @interaction(Interactions.NominationsNext)
    @interaction(Interactions.NominationsPrev)
    public async changePageInteraction(interaction: Interaction): Promise<void> {
        return this._changePageInteraction(interaction)
    }

    protected async getMessageEmbeds(
        serverId: string,
        options?: PaginatedOptionalUserQuery,
    ): Promise<Pick<MessageEditOptions, 'embeds'> | undefined> {
        const page = options?.page ?? 1
        const offset = (page - 1) * DEFAULT_LIMIT

        const rows = await this.repository.getServerNominationHistory({
            serverId,
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
                title: ':notepad_spiral: **Song of the Day Nominations History**',
                description: JSON.stringify(options).replace(/["{}]/g, '').replace(/:/g, ': ').replace(/,/g, ' | '),
                fields: rows.map((row, i) => ([
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
                        value: row.username,
                        inline: true,
                    },
                ])).flat(),
            }],
        }
    }
}
