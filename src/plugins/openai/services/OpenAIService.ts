import type { Message } from 'discord.js'
import { OpenAI } from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat'
import { ConfigurationError } from '../../../utils/command'
import { component } from '../../../utils/di'
import { error } from '../../../utils/plugin'

const CONFIG_ERROR_TEXT = 'the openai plugin is not correctly configured, please contact the server admin'

interface ReplyContent {
    reply: Promise<Message>
    content: string
}

@component()
export class OpenAIService {
    private _isSupported?: boolean
    private _openai?: OpenAI

    public isSupported(): boolean {
        if (typeof this._isSupported === 'undefined') {
            this._isSupported = Boolean(process.env.OPENAI_API_KEY)
        }

        return this._isSupported
    }

    public async getChatCompletionAndStartReply(
        message: Message,
        prompts: ChatCompletionMessageParam[],
        reply?: Promise<Message>,
    ): Promise<ReplyContent | undefined> {
        const sdk = this.getSdk()

        const foo = reply
            ? Promise.resolve(reply)
            : message.reply(`:thinking: ${message.client.user.username} is thinking ...`)

        try {
            const res = await sdk.chat.completions.create({
                model: 'gpt-4',
                messages: prompts,
                max_tokens: 1000,
                frequency_penalty: 0.5,
                presence_penalty: 0.0,
                temperature: 0.5,
            })

            console.info('openai: usage', res.usage)
            const content = res.choices.map(choice => choice.message.content?.trim()).join(' ')
            return { reply: foo, content }
        } catch (e) {
            console.error('openai: error', e)
            const content = error('an error occurred please try again later')
            foo.then(reply => reply.edit(content))
        }
    }

    public async sendChatCompletionAndReply(
        message: Message,
        prompts: ChatCompletionMessageParam[],
        prefix = '',
    ) {
        const res = await this.getChatCompletionAndStartReply(message, prompts)
        if ( ! res) {
            return
        }
        const { reply, content } = res
        return reply.then(reply => reply.edit(prefix + content))
    }

    public getSdk(): OpenAI {
        if ( ! this._openai) {
            if ( ! this.isSupported()) {
                throw new ConfigurationError(CONFIG_ERROR_TEXT)
            }
            this._openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        }

        return this._openai
    }
}
