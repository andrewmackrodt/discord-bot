import { Message } from 'discord.js'
import { injectable } from 'tsyringe'
import { AbstractTopicCommand } from './AbstractTopicCommand'
import { command } from '../../../utils/command'
import { OpenAIService } from '../services/OpenAIService'

const template = 'generate a satirical news story about {{ topic }}, it should be one paragraph and less than 1000 characters'

@injectable()
export default class NewsCommand extends AbstractTopicCommand{
    public constructor(openai: OpenAIService) {
        super(openai)
    }

    @command('news', {
        emoji: ':onion:',
        title: 'Fake News',
        description: 'Generate a satirical news story.',
        separator: null,
        args: { topic: {} },
    })
    public async news(message: Message, topic?: string) {
        return this.sendTopicResponse(message, template, topic)
    }
}
