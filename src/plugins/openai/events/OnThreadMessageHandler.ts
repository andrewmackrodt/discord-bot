import type { Message } from 'discord.js'
import type { ChatCompletionMessageParam } from 'openai/resources/chat'
import { injectable } from 'tsyringe'
import type { NextFunction, Plugin } from '../../../../types/plugins'
import { OpenAIService } from '../services/OpenAIService'

@injectable()
export class OnThreadMessageHandler implements Plugin {
    public constructor(
        private readonly openai: OpenAIService,
    ) {
    }

    public async onMessage(message: Message<true>, next: NextFunction): Promise<any> {
        const isConversationThread = message.channel.isThread() && Boolean(message.channel.name.match(/^(?:ask|chat)-?gpt\b/i))

        if ( ! isConversationThread) {
            return next()
        }

        const question = message.content.trim()
        const messages = await message.channel.messages.fetch({ before: message.id, limit: 9 })
        const prompts: ChatCompletionMessageParam[] = []

        messages.reverse().forEach(m => {
            if (m.system) {
                return
            }
            let content = m.content.trim()
            if (content.match(/^[#!.-]/)) {
                return
            }
            let role: 'assistant' | 'user'
            if (m.author.bot) {
                if (m.author.id !== message.client.user.id || ! content.startsWith('Answer: ')) {
                    return
                }
                content = content.substring(8)
                role = 'assistant'
            } else {
                role = 'user'
            }
            prompts.push({ role, content })
        })

        prompts.push({ role: 'user', content: question })

        return this.openai.sendChatCompletionAndReply(message, prompts, 'Answer: ')
    }
}
