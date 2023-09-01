import { Message } from 'discord.js'
import { injectable } from 'tsyringe'
import { command } from '../../../utils/command'
import { error, lookupUserId, sendErrorReply, sendGenericErrorReply } from '../../../utils/plugin'
import { FaqRepository } from '../repositories/FaqRepository'

@injectable()
export default class FaqGetCommand {
    public constructor(
        private readonly repository: FaqRepository,
    ) {
    }

    @command('faq get', {
        description: 'Get a FAQ.',
        args: {
            name: { required: true },
            recipient: {},
        },
    })
    public async getFaq(message: Message, name: string, recipient?: string): Promise<Message> {
        if ( ! message.guildId) {
            return sendGenericErrorReply(message)
        }

        const faq = await this.repository.getFaq(message.guildId, name)
        if ( ! faq) {
            return message.reply(error(`faq not found: **${name}**`))
        }

        let content = faq.content
        let recipientId: string | undefined

        if (recipient) {
            recipientId = await lookupUserId(message.channel, recipient)
            if ( ! recipientId) {
                return sendErrorReply(message, `unknown user: ${recipient}`)
            }

            content = `<@${recipientId}> ${content}`
        }

        return message.reply(content)
    }
}
