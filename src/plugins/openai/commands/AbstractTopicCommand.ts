import type { Message } from 'discord.js'
import type { ChatCompletionMessageParam } from 'openai/resources/chat'
import type { OpenAIService } from '../services/OpenAIService'

export abstract class AbstractTopicCommand {
    protected constructor(
        protected readonly openai: OpenAIService,
    ) {
    }

    protected async sendTopicResponse(message: Message, prompt: string, topic?: string) {
        if ( ! topic || (topic = topic.trim()).length === 0) {
            topic = 'any subject'
        }

        const question = prompt.replaceAll('{{ topic }}', topic)

        const prompts: ChatCompletionMessageParam[] = []
        prompts.push({ role: 'user', content: question })

        return this.openai.sendChatCompletionAndReply(message, prompts)
    }
}
