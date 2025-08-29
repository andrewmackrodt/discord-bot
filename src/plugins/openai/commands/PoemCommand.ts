import type { Message } from 'discord.js'
import { injectable } from 'tsyringe'

import { AbstractTopicCommand } from './AbstractTopicCommand'
import { command } from '../../../utils/command'
import { OpenAIService } from '../services/OpenAIService'

const template = 'generate a poem about {{ topic }}, it should be less than 1000 characters'

@injectable()
export default class PoemCommand extends AbstractTopicCommand {
    constructor(openai: OpenAIService) {
        super(openai)
    }

    @command('poem', {
        emoji: ':notepad_spiral:',
        title: 'Poem',
        description: 'Generate a poem.',
        separator: null,
        args: { topic: {} },
    })
    async poem(message: Message<true>, topic?: string) {
        return this.sendTopicResponse(message, template, topic)
    }
}
