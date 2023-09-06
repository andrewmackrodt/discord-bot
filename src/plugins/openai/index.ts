import { Message } from 'discord.js'
import { OpenAI } from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat'
import type { NextFunction, Plugin } from '../../../types/plugins'
import { command } from '../../utils/command'
import { error } from '../../utils/plugin'

const CONFIG_ERROR_TEXT = 'the openai plugin is not correctly configured, please contact the server admin'
const NO_MESSAGE_ERROR_TEXT = error('text cannot be empty')

export default class OpenAIPlugin implements Plugin {
    private _isSupported?: boolean
    private _openai?: OpenAI

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
        if ( ! this.isSupported) {
            return message.reply(CONFIG_ERROR_TEXT)
        }

        if (question.length === 0) {
            return message.reply(NO_MESSAGE_ERROR_TEXT)
        }

        const prompts: ChatCompletionMessageParam[] = []
        prompts.push({ role: 'user', content: question })

        return this.sendChatCompletionAndReply(message, prompts)
    }

    @command('haiku', {
        emoji: ':notepad_spiral:',
        title: 'Haiku',
        description: 'Generate a haiku.',
        separator: null,
        args: { topic: {} },
    })
    public async haiku(message: Message, topic?: string) {
        return this.sendTopicResponse(message,
            'generate a haiku about {{ topic }}, it should be less than 1000 characters', topic)
    }

    @command('news', {
        emoji: ':onion:',
        title: 'Fake News',
        description: 'Generate a satirical news story.',
        separator: null,
        args: { topic: {} },
    })
    public async news(message: Message, topic?: string) {
        return this.sendTopicResponse(message,
            'generate a satirical news story about {{ topic }}, it should be one paragraph and less than 1000 characters',
            topic)
    }

    @command('poem', {
        emoji: ':notepad_spiral:',
        title: 'Poem',
        description: 'Generate a poem.',
        separator: null,
        args: { topic: {} },
    })
    public async poem(message: Message, topic?: string) {
        return this.sendTopicResponse(message,
            'generate a poem about {{ topic }}, it should be less than 1000 characters', topic)
    }

    public async onMessage(message: Message, next: NextFunction): Promise<any> {
        const isConversationThread = message.channel.isThread() && Boolean(message.channel.name.match(/^(?:ask|chat)-?gpt\b/i))

        if ( ! isConversationThread) {
            return next()
        }

        if ( ! this.isSupported) {
            return message.reply(CONFIG_ERROR_TEXT)
        }

        const question = message.content.trim()
        if (question.length === 0) {
            return message.reply(NO_MESSAGE_ERROR_TEXT)
        }

        const prompts: ChatCompletionMessageParam[] = []
        const messages = await message.channel.messages.fetch({ before: message.id, limit: 9 })

        messages.reverse().forEach(m => {
            if (m.system) {
                return
            }
            let content = m.content.trim()
            if (content.match(/^[#!.]/)) {
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

        return this.sendChatCompletionAndReply(message, prompts, 'Answer: ')
    }

    protected async sendChatCompletionAndReply(message: Message, prompts: ChatCompletionMessageParam[], prefix: string = '') {
        const reply = message.reply(`:thinking: ${message.client.user.username} is thinking ...`)
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
            text = prefix + res.choices.map(choice => choice.message.content?.trim()).join(' ')
        } catch (e) {
            console.error('openai: error', e)
            text = error('an error occurred please try again later')
        }

        return reply.then(reply => reply.edit(text))
    }

    protected async sendTopicResponse(message: Message, prompt: string, topic?: string) {
        if ( ! this.isSupported) {
            return message.reply(CONFIG_ERROR_TEXT)
        }

        if ( ! topic || (topic = topic.trim()).length === 0) {
            topic = 'any subject'
        }

        const question = prompt.replaceAll('{{ topic }}', topic)

        const prompts: ChatCompletionMessageParam[] = []
        prompts.push({ role: 'user', content: question })

        return this.sendChatCompletionAndReply(message, prompts)
    }

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
}
