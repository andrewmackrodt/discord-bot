import type { Message } from 'discord.js'

import { command } from '../../utils/command'

export default class EchoPlugin {
    @command('echo', {
        emoji: ':repeat:',
        title: 'Echo',
        description: 'Send a message from the bot.',
        separator: null,
        args: {
            text: { required: true },
        },
    })
    async sendMessageToChannel(message: Message<true>, text: string): Promise<any> {
        return message.channel.send(text)
    }
}
