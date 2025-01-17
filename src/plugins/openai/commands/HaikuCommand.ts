import type { Message } from 'discord.js'
import { injectable } from 'tsyringe'
import { AbstractTopicCommand } from './AbstractTopicCommand'
import { command } from '../../../utils/command'
import { OpenAIService } from '../services/OpenAIService'

const template = 'generate a haiku about {{ topic }}, it should be less than 1000 characters'

@injectable()
export default class HaikuCommand extends AbstractTopicCommand{
    public constructor(openai: OpenAIService) {
        super(openai)
    }

    @command('haiku', {
        emoji: ':notepad_spiral:',
        title: 'Haiku',
        description: 'Generate a haiku.',
        separator: null,
        args: { topic: {} },
    })
    public async sendHaiku(message: Message<true>, topic?: string) {
        return this.sendTopicResponse(message, template, topic)
    }
}
