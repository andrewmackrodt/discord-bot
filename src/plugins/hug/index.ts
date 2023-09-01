import { Message } from 'discord.js'
import { command } from '../../utils/command'
import { lookupUserId, sendGenericErrorReply } from '../../utils/plugin'

export default class HugPlugin {
    @command('hug', {
        emoji: ':people_hugging:',
        title: 'Hug',
        description: 'Hug a member in the channel.',
        args: {
            recipient: { required: true },
            initiator: {},
        },
    })
    public async replyHug(message: Message, recipient: string, initiator?: string): Promise<any> {
        return this.sendMessage(
            ':people_hugging:', 'hugs', ' while sobbing "I\'m so alone"', message, recipient, initiator)
    }

    @command('slap', {
        emoji: ':wave:',
        title: 'Slap',
        description: 'Slap a member in the channel.',
        args: {
            recipient: { required: true },
            initiator: {},
        },
    })
    public async replySlap(message: Message, recipient: string, initiator?: string): Promise<any> {
        return this.sendMessage(
            ':wave:', 'slaps', ' while grinning manically', message, recipient, initiator)
    }

    protected async sendMessage(
        emoji: string,
        verb: string,
        selfSuffix: string,
        message: Message,
        recipient: string,
        initiator?: string,
    ): Promise<any> {
        const recipientId = await lookupUserId(message.channel, recipient)
        const initiatorId = initiator ? await lookupUserId(message.channel, initiator) : message.author.id

        if ( ! recipientId || ! initiatorId) {
            return sendGenericErrorReply(message)
        }

        const strength = Math.round(Math.random() * 100)
        let text: string

        if (recipientId === initiatorId) {
            text = `<@!${initiatorId}> ${verb} themself with ${strength}% strength${selfSuffix}.`
        } else {
            text = `<@!${initiatorId}> ${verb} <@!${recipientId}> with ${strength}% strength.`
        }

        return message.channel.send(`${emoji}  ${text}`)
    }
}
