import type { Message } from 'discord.js'
import { injectable } from 'tsyringe'

import { command } from '../../../utils/command'
import { error } from '../../../utils/plugin'
import { FaqRepository } from '../repositories/FaqRepository'

@injectable()
export default class FaqListCommand {
    constructor(private readonly repository: FaqRepository) {}

    @command('faq list', {
        description: 'List all FAQs.',
    })
    async get(message: Message<true>): Promise<Message> {
        const names = await this.repository.listFaq(message.guildId)

        if (names.length === 0) {
            return message.reply(error('server has no faqs'))
        }

        return message.reply('.faq <' + names.join(' | ') + '>')
    }
}
