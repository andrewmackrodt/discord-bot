import type { ButtonComponent } from 'discord.js'
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Interaction, Message } from 'discord.js'
import { injectable } from 'tsyringe'
import { command } from '../../../utils/command'
import { interaction } from '../../../utils/interaction'
import { suppressInteractionReply } from '../../song-of-the-day/helpers'
import { OpenAIService } from '../services/OpenAIService'

const format = `At least one paragraph to advance the story, using 250 words or less.

[1]: decision one in less than 50 characters
[2]: decision two in less than 50 characters`

const constraint = `
    This is an interactive text adventure. You must slowly advance the story in every response using paragraphs. Use no
    more than 250 words to do this. Additionally, present 2 to 4 realistic choices on how to continue the story. Each
    choice must be less than 50 characters. Respond using the format:
    `
        .trim()
        .replaceAll(/^[ \t]+/gm, '')
        .replaceAll('\n', ' ')
    + '\n\n' + format

const template = 'Create a new story about {{ topic }}.'

enum StoryChoiceInteractions {
    Choice1 = 'openai.cya.choice.0',
    Choice2 = 'openai.cya.choice.1',
    Choice3 = 'openai.cya.choice.2',
    Choice4 = 'openai.cya.choice.3',
}

const storyChoiceEnumValues = Object.values(StoryChoiceInteractions)

interface StoryChoicesResponse {
    story: string
    choices: string[]
}

function parseCompletionResponse(text: string): StoryChoicesResponse {
    const lines = text.trim().split('\n')
    const choices: string[] = []
    let i = lines.length - 1
    for ( ; i >= 0; i--) {
        const match = lines[i].trim().match(/^\[\d\]: (.+)/)
        if ( ! match) {
            break
        }
        choices.push(match[1])
        if (choices.length >= storyChoiceEnumValues.length) {
            break
        }
    }
    choices.reverse()
    const story = lines.slice(0, i).join('\n').trim()
    return { story, choices }
}

@injectable()
export default class CyaCommand {
    private readonly processing: Set<string> = new Set()

    public constructor(
        private readonly openai: OpenAIService,
    ) {
    }

    @command('cya', {
        emoji: ':notepad_spiral:',
        title: 'Choose Your Own Adventure',
        description: 'Generate an interactive text adventure.',
        separator: null,
        args: {
            topic: { required: true },
        },
    })
    public async createAdventure(message: Message<true>, topic: string) {
        const userInput = template.replaceAll('{{ topic }}', topic.replace(/\.$/, ''))
        const res = await this.openai.getChatCompletionAndStartReply(message, [
            { role: 'system', content: constraint },
            { role: 'user', content: userInput },
        ])
        if ( ! res) {
            return
        }
        const { reply, content } = res
        const { story, choices } = parseCompletionResponse(content)
        return reply.then(reply => reply.edit({
            content: story,
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    ...choices.map((o, i) => new ButtonBuilder()
                        .setCustomId(storyChoiceEnumValues[i])
                        .setLabel(o)
                        .setStyle(ButtonStyle.Secondary)),
                ),
            ],
        }))
    }

    @interaction(StoryChoiceInteractions.Choice1)
    @interaction(StoryChoiceInteractions.Choice2)
    @interaction(StoryChoiceInteractions.Choice3)
    @interaction(StoryChoiceInteractions.Choice4)
    public async choiceHandler(interaction: Interaction): Promise<void> {
        if ( ! (interaction instanceof ButtonInteraction) || ! interaction.message.inGuild()) {
            return
        }

        if (this.processing.has(interaction.message.id)) {
            return suppressInteractionReply(interaction)
        }

        this.processing.add(interaction.message.id)

        try {
            await this.replyToChoice(interaction)
        } finally {
            this.processing.delete(interaction.message.id)
        }
    }

    private async replyToChoice(interaction: ButtonInteraction) {
        const reply = interaction.deferReply({ fetchReply: true })

        const assistantOutput = interaction.message.content
        let edited = assistantOutput + '\n'
        const choiceIndex = interaction.customId.replaceAll(/[^0-9]+/g, '')
        let userInput: string

        const buttons = interaction.message.components[0].components as ButtonComponent[]

        for (const i in buttons) {
            let line = `[${parseInt(i) + 1}]: ${buttons[i].label}`
            if (i === choiceIndex) {
                userInput = line
                line = `**${line}**`
            }
            edited = edited + '\n' + line
        }

        const res = await this.openai.getChatCompletionAndStartReply(interaction.message, [
            { role: 'system', content: constraint },
            { role: 'assistant', content: assistantOutput },
            { role: 'user', content: userInput! },
        ], reply)

        if ( ! res) {
            return
        }

        const { story, choices } = parseCompletionResponse(res.content)
        await interaction.editReply({
            content: story,
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    ...choices.map((o, i) => new ButtonBuilder()
                        .setCustomId(storyChoiceEnumValues[i])
                        .setLabel(o)
                        .setStyle(ButtonStyle.Secondary)),
                ),
            ],
        })

        await interaction.message.edit({ content: edited, components: [] })
    }
}
