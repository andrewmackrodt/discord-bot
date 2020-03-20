import {Message} from 'discord.js'
import {Plugin, NextFunction} from '../../typings/plugins'
import axios from 'axios'

const url = 'http://yerkee.com/api/fortune'

interface FortuneResponse {
    fortune: string
}

const plugin: Plugin = async (msg: Message, next: NextFunction): Promise<any> => {
    if (msg.content.match(/!fortune/i) === null) {
        return next()
    }

    const response = await axios.get<FortuneResponse>(url)

    return msg.reply(response.data.fortune)
}

export default plugin
