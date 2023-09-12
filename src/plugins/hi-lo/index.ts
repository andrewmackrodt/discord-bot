import type { MessageCreateOptions } from 'discord.js'
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Interaction, Message } from 'discord.js'
import { command } from '../../utils/command'
import { interaction } from '../../utils/interaction'
import { suppressInteractionReply } from '../song-of-the-day/helpers'

enum Interactions {
    Hi = 'hilo.hi',
    Lo = 'hilo.lo',
    Restart = 'hilo.restart',
}

function getNumber(content: string, search: RegExp): number | null {
    const match = search.exec(content)?.[1]
    let value: number

    if ( ! match || isNaN((value = parseInt(match)))) {
        return null
    }

    return value
}

export default class HiLoPlugin {
    @command('hi-lo', {
        emoji: ':arrows_clockwise:',
        title: 'Hi-Lo',
        description: 'Guess if the next number is higher or lower.',
    })
    public async createHiLo(message: Message<true>): Promise<any> {
        return message.channel.send(this.getNewGameMessage())
    }

    @interaction(Interactions.Hi)
    @interaction(Interactions.Lo)
    public async hiLoInteraction(interaction: Interaction): Promise<void> {
        if ( ! (interaction instanceof ButtonInteraction) ||
            ! interaction.message.inGuild()
        ) {
            return
        }

        const content = interaction.message.content
        const current = getNumber(content, /current number:? ([0-9]+)/i)
        const streak  = getNumber(content, /streak:? ([0-9]+)/i)
        const max     = getNumber(content, /range:? 1-([0-9]+)/i)

        if (current === null || streak === null || max === null) {
            return suppressInteractionReply(interaction)
        }

        let next = current

        while (next === current) {
            next = this.getRandom(max)
        }

        const verb = next > current ? 'higher' : 'lower'

        const isCorrect =
            interaction.customId === Interactions.Hi && (next > current) ||
            interaction.customId === Interactions.Lo && (next < current)

        if (isCorrect) {
            await interaction.message.edit({
                content: [
                    `Current Number: ${next}`,
                    `Streak: ${streak + 1}`,
                    `Range: 1-${max}`,
                ].join('\n'),
            })
        } else {
            await interaction.message.edit({
                content: [
                    `Game over ${next} is ${verb} than ${current}`,
                    `Streak: ${streak}`,
                    `Range: 1-${max}`,
                ].join('\n'),
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId(Interactions.Restart)
                            .setLabel('Play Again')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('🔁'),
                    ),
                ],
            })
        }

        void suppressInteractionReply(interaction)
    }

    @interaction(Interactions.Restart)
    public async restartInteraction(interaction: Interaction): Promise<void> {
        if ( ! (interaction instanceof ButtonInteraction) ||
            ! interaction.message.inGuild()
        ) {
            return
        }

        const content = interaction.message.content
        const max     = getNumber(content, /range:? 1-([0-9]+)/i)

        if (max === null) {
            return suppressInteractionReply(interaction)
        }

        await interaction.message.edit(this.getNewGameMessage(max))

        void suppressInteractionReply(interaction)
    }

    protected getRandom(max = 100): number {
        return Math.ceil(max * Math.random())
    }

    protected getNewGameMessage(max = 100): Pick<MessageCreateOptions, 'content' | 'components'> {
        return {
            content: [
                `Current Number: ${this.getRandom(max)}`,
                'Streak: 0',
                `Range: 1-${max}`,
            ].join('\n'),
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId(Interactions.Hi)
                        .setLabel('Hi')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⬆'),
                    new ButtonBuilder()
                        .setCustomId(Interactions.Lo)
                        .setLabel('Lo')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⬇'),
                ),
            ],
        }
    }
}
