import { Message } from 'discord.js'
import { injectable } from 'tsyringe'
import { command } from '../../../utils/command'
import { error, sendGenericErrorReply } from '../../../utils/plugin'
import { FaqRepository } from '../repositories/FaqRepository'

@injectable()
export default class FaqListCommand {
    public constructor(
        private readonly repository: FaqRepository,
    ) {
    }

    @command('faq list', {
        description: 'List all FAQs.',
    })
    public async get(message: Message<true>): Promise<Message> {
        const names = await this.repository.listFaq(message.guildId)

        if (names.length === 0) {
            return message.reply(error('server has no faqs'))
        }

        return message.reply('.faq <' + names.join(' | ') + '>')
    }
}
