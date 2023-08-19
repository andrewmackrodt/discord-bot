import type { Message } from 'discord.js'
import { OpenAI } from 'openai'
import type { NextFunction, Plugin } from '../../../types/plugins'

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
        if (msg.content.match(/!ask/i) === null) {
            return next()
        }

        if ( ! this.isSupported) {
            return msg.reply('the openai plugin is not correctly configured, please contact the server admin')
        }

        const content = msg.content.replace(/^!ask[ \t]*/, '')
            .trim()
            .replace(/[ ?]+$/, '') + '?'

        if (content.length < 11) {
            return msg.reply('usage: `!ask what is the meaning of life?`')
        }

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content }],
            max_tokens: 1000,
            frequency_penalty: 0.5,
            presence_penalty: 0.0,
            temperature: 0.5,
        })

        const reply = response.choices.map(choice => choice.message.content?.trim()).join(' ')

        return msg.reply(reply)
    }
}
