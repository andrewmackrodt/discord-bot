import { Message } from 'discord.js'
import { injectable } from 'tsyringe'
import { command } from '../../../utils/command'
import { error, success } from '../../../utils/plugin'
import { FaqRepository } from '../repositories/FaqRepository'

@injectable()
export default class FaqDeleteCommand {
    public constructor(
        private readonly repository: FaqRepository,
    ) {
    }

    @command('faq delete', {
        description: 'Delete a FAQ.',
        args: {
            name: { required: true },
        },
    })
    public async delete(message: Message<true>, name: string): Promise<Message> {
        if ( ! message.member?.permissions.has('ManageMessages')) {
            return message.reply(error('you do not have permission to manage faqs on this server'))
        }

        const isDeleted = await this.repository.deleteFaq(message.guildId, name)
        let content: string

        if (isDeleted) {
            content = success(`faq deleted: **${name}**`)
        } else {
            content = error(`faq not found: **${name}**`)
        }

        return message.reply(content)
    }
}
