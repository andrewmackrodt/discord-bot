import { Message } from 'discord.js'
import type { ChatCompletionMessageParam } from 'openai/resources/chat'
import { injectable } from 'tsyringe'
import { command } from '../../../utils/command'
import { OpenAIService } from '../services/OpenAIService'

@injectable()
export default class AskCommand {
    public constructor(
        private readonly openai: OpenAIService,
    ) {
    }

    @command('ask', {
        emoji: ':robot:',
        title: 'GPT-4',
        description: 'Ask GPT-4 a question.',
        separator: null,
        args: {
            question: { required: true },
        },
    })
    public async ask(message: Message, question: string) {
        const prompts: ChatCompletionMessageParam[] = []
        prompts.push({ role: 'user', content: question })

        return this.openai.sendChatCompletionAndReply(message, prompts)
    }
}
