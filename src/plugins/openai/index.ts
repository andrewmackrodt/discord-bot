import { NextFunction, Plugin } from '../../../types/plugins'
import { Message } from 'discord.js'
import { OpenAI } from 'openai'

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

        let question = msg.content.replace(/^!ask[ \t]*/, '').trim()

        if (question.length === 0) {
            return msg.reply('usage: `!ask what is the meaning of life?`')
        }

        if (question[question.length - 1] !== '?') {
            question += '?'
        }

        const response = await this.openai.completions.create({
            model: 'text-davinci-003',
            prompt: `Marv is a chatbot that reluctantly answers questions with sarcastic responses:\n\nYou: ${question}\nMarv:`,
            temperature: 0.5,
            max_tokens: 60,
            top_p: 0.3,
            frequency_penalty: 0.5,
            presence_penalty: 0.0,
        })

        const reply = response.choices.map(choice => choice.text?.trim()).join(' ')

        return msg.reply(reply)
    }
}
