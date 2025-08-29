import axios from 'axios'
import type { Message } from 'discord.js'

import { command } from '../../utils/command'

const url = 'http://yerkee.com/api/fortune'

interface FortuneResponse {
    fortune: string
}

export default class FortunePlugin {
    @command('fortune', {
        emoji: ':fortune_cookie:',
        title: 'Fortune',
        description: 'Fetch a random fortune.',
    })
    async replyFortune(message: Message<true>): Promise<any> {
        const response = await axios.get<FortuneResponse>(url)
        const { fortune } = response.data
        return message.reply(`:fortune_cookie: ${fortune}`)
    }
}
