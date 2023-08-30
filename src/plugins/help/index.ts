import type { APIEmbedField, MessageCreateOptions } from 'discord.js'
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, Message , Interaction } from 'discord.js'
import { getFieldName } from './utils'
import type { Plugin } from '../../../types/plugins'
import type { Command } from '../../registries/Command'
import type { CommandRegistry } from '../../registries/CommandRegistry'
import { command } from '../../utils/command'
import { interaction } from '../../utils/interaction'
import { suppressInteractionReply } from '../song-of-the-day/helpers'

enum Interactions {
    HelpNext = 'help.next',
    HelpPrev = 'help.prev',
}

const PAGE_SIZE = 15

export default class HelpPlugin implements Plugin {
    private _commands?: Command[]
    private _registry?: CommandRegistry

    @command('help', {
        emoji: ':robot:',
        title: 'Bot Commands',
        description: 'Display help.',
    })
    public async replyHelp(message: Message): Promise<any> {
        const embed = new EmbedBuilder()
            .setTitle(':robot:  Bot Commands')
            .setDescription(
                'Commands listed with `<>` require arguments, e.g. `.8ball <question>`. A question mark ' +
                'indicates that the argument is optional, e.g. `.roll <2d10?>`.\n---')
            .setFields(this.getPageFields())

        const options: MessageCreateOptions = { embeds: [embed] }

        if (this.pageCount > 1) {
            embed.setFooter({ text: `Page 1 of ${this.pageCount}` })
            options.components = [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(Interactions.HelpPrev)
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⏮'),
                    new ButtonBuilder()
                        .setCustomId(Interactions.HelpNext)
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⏭'),
                ) as any,
            ]
        }

        return message.channel.send(options)
    }

    @interaction(Interactions.HelpNext)
    @interaction(Interactions.HelpPrev)
    public async changePageInteraction(interaction: Interaction): Promise<void> {
        if ( ! (interaction instanceof ButtonInteraction) ||
            ! interaction.message.guild
        ) {
            return
        }

        const embed = interaction.message.embeds[0]
        const pageStr = /page:? ([0-9]+)/i.exec(embed.footer?.text ?? '')?.[1]
        let page: number

        if ( ! pageStr || isNaN((page = parseInt(pageStr)))) {
            return
        }

        if (interaction.customId.includes('.prev')) {
            if (page === 1) {
                return suppressInteractionReply(interaction)
            }
            page--
        } else {
            if (page === this.pageCount) {
                return suppressInteractionReply(interaction)
            }
            page++
        }

        const fields = this.getPageFields(page)

        if (fields.length > 0) {
            const builder = new EmbedBuilder(embed.data)
                .setFields(fields)
                .setFooter({ text: `Page ${page} of ${this.pageCount}` })

            await interaction.message.edit({ embeds: [builder] })
        }

        void suppressInteractionReply(interaction)
    }

    protected getPageFields(page: number = 1): APIEmbedField[] {
        const start = (page - 1) * PAGE_SIZE
        return this.commands.slice(start, start + PAGE_SIZE)
            .map(c => ({
                name: getFieldName(c),
                inline: true,
                value: c.description?.replace(/[\s.]+$/, '').toLowerCase() ?? 'n/a',
            }))
    }

    public doCommandRegistration(registry: CommandRegistry) {
        this._registry = registry
    }

    protected get commands(): Command[] {
        if (typeof this._commands !== 'undefined') {
            return this._commands
        }
        if ( ! this._registry) {
            return []
        }
        this._commands = this._registry.list()
        this._commands.sort((a, b) => a.command.localeCompare(b.command))
        return this._commands
    }

    protected get pageCount(): number {
        return this.commands.length > 0 ? Math.ceil(this.commands.length / PAGE_SIZE) : 0
    }
}
