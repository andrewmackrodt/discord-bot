import type { Message } from 'discord.js'
import { OpenAI } from 'openai'
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
        if (msg.content.match(/!ask/i) === null) {
            return next()
        }

        if ( ! this.isSupported) {
            return msg.reply('the openai plugin is not correctly configured, please contact the server admin')
        }

        const question = msg.content.replace(/^!ask[ \t]*/, '').trim()

        if (question.length < 11) {
            return msg.reply('usage: `!ask what is the meaning of life?`')
        }

        const reply = msg.reply(`:thinking: ${msg.client.user.username} is thinking ...`)
        let text: string

        try {
            const res = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [{ role: 'user', content: question }],
                max_tokens: 1000,
                frequency_penalty: 0.5,
                presence_penalty: 0.0,
                temperature: 0.5,
            })

            text = res.choices.map(choice => choice.message.content?.trim()).join(' ')
        } catch (e) {
            console.error('openai: error', e)
            text = error('an error occurred please try again later')
        }

        return reply.then(reply => reply.edit(text))
    }
}
