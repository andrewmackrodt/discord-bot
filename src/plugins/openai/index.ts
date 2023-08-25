import type { Message } from 'discord.js'
import { OpenAI } from 'openai'
import type { CreateChatCompletionRequestMessage } from 'openai/resources/chat'
import type { NextFunction, Plugin } from '../../../types/plugins'
import { error } from '../../utils/plugin'

export default class OpenAIPlugin implements Plugin {
    private _isSupported?: boolean
    private _openai?: OpenAI

    protected get isSupported(): boolean {
        if (typeof this._isSupported === 'undefined') {
            this._isSupported = Boolean(process.env.OPENAI_API_KEY)
        }

        return this._isSupported
    }

    protected get openai(): OpenAI {
        if ( ! this._openai) {
            this._openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        }

        return this._openai
    }

    public async onMessage(msg: Message, next: NextFunction): Promise<any> {
        const isConversationThread = msg.channel.isThread() && Boolean(msg.channel.name.match(/^(?:ask|chat)-?gpt\b/i))

        if ( ! isConversationThread && msg.content.match(/!ask/i) === null) {
            return next()
        }

        if ( ! this.isSupported) {
            return msg.reply('the openai plugin is not correctly configured, please contact the server admin')
        }

        const question = msg.content.replace(/^!ask[ \t]*/, '').trim()

        if (question.length === 0) {
            return msg.reply('usage: `!ask what is the meaning of life?`')
        }

        const prompts: CreateChatCompletionRequestMessage[] = []

        if (isConversationThread) {
            const messages = await msg.channel.messages.fetch({ before: msg.id, limit: 9 })
            messages.reverse().forEach(m => {
                if (m.system) {
                    return
                }
                let content = m.content.replace(/^!ask[ \t]*/, '').trim()
                if (content.match(/[!#]/)) {
                    return
                }
                let role: 'assistant' | 'user'
                if (m.author.bot) {
                    if (m.author.id !== msg.client.user.id || ! content.startsWith('Answer: ')) {
                        return
                    }
                    content = content.substring(8)
                    role = 'assistant'
                } else {
                    role = 'user'
                }
                prompts.push({ role, content })
            })
        }

        prompts.push({ role: 'user', content: question })

        const reply = msg.reply(`:thinking: ${msg.client.user.username} is thinking ...`)
        let text: string

        try {
            const res = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: prompts,
                max_tokens: 1000,
                frequency_penalty: 0.5,
                presence_penalty: 0.0,
                temperature: 0.5,
            })

            console.info('openai: usage', res.usage)
            text = res.choices.map(choice => choice.message.content?.trim()).join(' ')
            if (isConversationThread) text = `Answer: ${text}`
        } catch (e) {
            console.error('openai: error', e)
            text = error('an error occurred please try again later')
        }

        return reply.then(reply => reply.edit(text))
    }
}
