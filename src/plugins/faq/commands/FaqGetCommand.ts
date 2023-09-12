import type { APIEmbed } from 'discord.js'
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
    public async getFaq(message: Message<true>, name: string, recipient?: string): Promise<Message> {
        const faq = await this.repository.getFaq(message.guildId, name)
        if ( ! faq) {
            return message.reply(error(`faq not found: **${name}**`))
        }

        const embeds: APIEmbed[] = []
        let content = faq.content.trim()
        let match: RegExpMatchArray | null = null

        while ((match = content.match(/https?:\/\/[^ ]+\.(?:jpe?g|gif|png)$/i)) !== null) {
            content = content.substring(0, content.length - match[0].length).trim()
            embeds.unshift({ image: { url: match[0] } })
        }

        let recipientId: string | undefined

        if (recipient) {
            recipientId = await lookupUserId(message.channel, recipient)
            if ( ! recipientId) {
                return sendErrorReply(message, `unknown user: ${recipient}`)
            }

            content = `<@${recipientId}> ${content}`
        }

        return message.channel.send({ content, embeds })
    }
}
