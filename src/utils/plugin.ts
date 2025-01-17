import type { Message , Channel } from 'discord.js'
import { ChannelType } from 'discord.js'
import type { Command } from '../registries/Command'

export function sendErrorReply(message: Message, text: string): Promise<any> {
    return message.reply(error(text))
}

export function sendErrorToChannel(message: Message, text: string): Promise<any> {
    if (message.channel.isSendable()) {
        return message.channel.send(error(text))
    } else {
        // todo log error
        return Promise.resolve()
    }
}

export function sendGenericErrorReply(message: Message): Promise<any> {
    return sendErrorReply(message, 'an unknown error has occurred')
}

export function sendGenericErrorToChannel(message: Message): Promise<any> {
    return sendErrorToChannel(message, 'an unknown error has occurred')
}

export function error(text: string): string {
    return `_error: ${text}_`
}

export function success(text: string): string {
    return `:white_check_mark:  ${text}`
}

export async function replyWithCommandHelp(message: Message, command: Command, err?: string): Promise<Message> {
    const content = formatCommandUsage(command, err)

    return message.reply(content)
}

function formatCommandUsage(command: Command, err?: string): string {
    const buffer: string[] = []

    if (err) {
        buffer.push(error(err) + '\n')
    }

    // add title
    let title = findFirst(command, 'title')
    title = title ? `**${title} Help**` : `**"${command.fullCommand}" help**`
    const emoji = findFirst(command, 'emoji')
    if (emoji) title = [emoji, title].join('  ')
    buffer.push(`${title}`)

    // add command help
    buffer.push('```')
    if (Object.keys(command.subcommands).length > 0) {
        // add usage instructions for all subcommands
        for (const subcommand of Object.values(command.subcommands)) {
            addCommandUsageToBuffer(subcommand, buffer)
        }
    } else {
        // add usage instructions for command arguments
        addCommandUsageToBuffer(command, buffer)
    }
    buffer.push('```')

    return buffer.join('\n')
}

function addCommandUsageToBuffer(command: Command, buffer: string[]) {
    const description = command.description || `".${command.fullCommand}" usage example`
    buffer.push(`# ${description}`)
    const lineBuffer: string[] = []
    lineBuffer.push(`.${command.fullCommand}`)
    const argBuffer: string[] = []
    for (const [arg, options] of Object.entries(command.args)) {
        let str: string
        if (options.example) {
            str = options.example
        } else {
            str = arg
            if ( ! options.required) str += '?'
            str = `<${str}>`
        }
        argBuffer.push(str)
    }
    const separator = typeof command.separator === 'string'
        ? command.separator  + ' '
        : ' '
    lineBuffer.push(argBuffer.join(separator))
    buffer.push(lineBuffer.join(' '))
    buffer.push('')
}

function findFirst<K extends keyof Command>(command: Command, key: K): Command[K] | undefined {
    for (
        let c: Command | undefined = command;
        typeof c !== 'undefined';
        c = c.parent
    ) {
        if (typeof c[key] !== 'undefined') {
            return c[key]
        }
    }
}

export async function lookupUserId(channel: Channel, nameOrMention: string): Promise<string | undefined> {
    if (channel.type !== ChannelType.GuildText) {
        return
    }

    const userIdMentionMatch = nameOrMention.match(/^<@([0-9]+)>$/)

    if (userIdMentionMatch) {
        return userIdMentionMatch[1]
    }

    const member = channel.members.find(m => (
        m.user.username.localeCompare(nameOrMention, undefined, { sensitivity: 'base' }) === 0 ||
        m.user.globalName?.localeCompare(nameOrMention, undefined, { sensitivity: 'base' }) === 0
    ))

    if (member) {
        return member.id
    }
}
