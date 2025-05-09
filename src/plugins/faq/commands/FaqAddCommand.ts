import type { Message } from 'discord.js'
import { injectable } from 'tsyringe'
import { command } from '../../../utils/command'
import { error, success } from '../../../utils/plugin'
import { FaqRepository } from '../repositories/FaqRepository'

@injectable()
export default class FaqAddCommand {
    public constructor(
        private readonly repository: FaqRepository,
    ) {
    }

    @command('faq add', {
        description: 'Add a new FAQ.',
        lastArgIsText: true,
        args: {
            name: { required: true },
            content: { required: true },
        },
    })
    public async add(message: Message<true>, name: string, content: string): Promise<Message> {
        if ( ! message.member?.permissions.has('ManageMessages')) {
            return message.reply(error('you do not have permission to manage faqs on this server'))
        }

        await this.repository.addFaq(message.guildId, name, content, message.author.id)
        return message.reply(success(`faq added: **${name}**`))
    }
}
