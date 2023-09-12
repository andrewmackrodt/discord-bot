import type { MessageCreateOptions, MessageEditOptions, Interaction, Message, TextChannel } from 'discord.js'
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js'
import { error, lookupUserId } from '../../../utils/plugin'
import type { PaginatedOptionalUserQuery } from '../helpers'
import { suppressInteractionReply } from '../helpers'
import type { SongOfTheDayRepository } from '../repositories/SongOfTheDayRepository'

export abstract class AbstractSongOfTheDayHistoryCommand {
    protected abstract get nextInteractionCustomId(): string
    protected abstract get prevInteractionCustomId(): string

    protected abstract getMessageEmbeds(channel: TextChannel, options?: PaginatedOptionalUserQuery): Promise<Pick<MessageEditOptions, 'embeds'> | undefined>

    protected constructor(
        protected readonly repository: SongOfTheDayRepository,
    ) {
    }

    protected async sendInitialHistoryMessage(message: Message<true>, userId?: string): Promise<Message> {
        const options: PaginatedOptionalUserQuery = { page: 1 }

        if (typeof userId === 'string') {
            options.userId = await lookupUserId(message.channel, userId)

            if ( ! options.userId) {
                return message.channel.send(error(`unknown user: ${userId}`))
            }
        }

        const embed = await this.getMessageEmbeds(message.channel as TextChannel, options) as MessageCreateOptions

        if ( ! embed) {
            return message.channel.send('history is empty')
        }

        embed.components = [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(this.prevInteractionCustomId)
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏮'),
                new ButtonBuilder()
                    .setCustomId(this.nextInteractionCustomId)
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏭'),
            ),
        ]

        return message.channel.send(embed)
    }

    protected async _changePageInteraction(interaction: Interaction): Promise<void> {
        if ( ! (interaction instanceof ButtonInteraction) ||
            ! interaction.message.inGuild()
        ) {
            return
        }

        const description = interaction.message.embeds[0].description as string
        const pageStr = /page(?: |: ?)([0-9]+)/.exec(description)?.[1]
        let page: number

        if ( ! pageStr || isNaN((page = parseInt(pageStr, 10)))) {
            return
        }

        const userId = /userId(?: |: ?)([0-9]+)/.exec(description)?.[1]

        if (interaction.customId.includes('.prev')) {
            // ignore if trying to seek before first page
            if (page === 1) {
                void suppressInteractionReply(interaction)
                return
            }
            page--
        } else {
            page++
        }

        const options: PaginatedOptionalUserQuery = { page, userId }
        const reply = await this.getMessageEmbeds(interaction.channel as TextChannel, options)

        if (reply) {
            await interaction.message.edit(reply)
        }

        void suppressInteractionReply(interaction)
    }
}
