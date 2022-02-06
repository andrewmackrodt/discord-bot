import Discord, { Message } from 'discord.js'
import { padRight } from './string'

export interface CommandUsage {
    command: string[]
    title: string
    usage: string
    params?: Record<string, string>
}

export function getCommandUsage(commandsUsage: CommandUsage[], ...params: string[]): CommandUsage {
    const paramsStr = params.join(' ')

    const usage = commandsUsage.find(help => (
        help.command.length === params.length && help.command.join(' ') === paramsStr
    ))

    if ( ! usage) {
        throw new Error(`unknown command: ${params.join(' ')}`)
    }

    return usage
}

function formatCommandUsage(usage: CommandUsage): string {
    const text: string[] = []
    text.push(`**${usage.title}**:`)
    text.push('```')
    text.push(usage.usage)

    if (usage.params) {
        const params: string[] = []
        for (const [param, description] of Object.entries(usage.params)) {
            params.push(' ' + padRight(param, 10) + description)
        }
        if (params.length > 0) {
            text.push('')
            text.push('params:')
            text.push(...params)
        }
    }

    text.push('```')

    return '> ' + text.join('\n> ')
}

export async function sendCommandHelpMessage(
    message: Message,
    usage: CommandUsage,
    isSyntaxError = false,
): Promise<Message> {
    let response = formatCommandUsage(usage)

    if (isSyntaxError) {
        response = error('the command contains a syntax error') + `\n\n${response}`
    }

    return message.channel.send(response)
}

export async function sendPluginHelpMessage(
    title: string,
    commandsUsage: CommandUsage[],
    message: Discord.Message,
    params: string[] = [],
): Promise<Discord.Message> {
    const helpText = `${title}\n\n` + Object.values(commandsUsage).map(formatCommandUsage).join('\n')
    let replyPrefix = ''

    if (params.length > 0) {
        const paramsStr = params.join(' ')

        for (const usage of commandsUsage) {
            if (params.length === usage.command.length && paramsStr === usage.command.join(' ')) {
                return sendCommandHelpMessage(message, usage)
            }
        }

        replyPrefix = error('unknown command') + '\n\n'
    }

    return message.channel.send(replyPrefix + helpText)
}

export function error(text: string): string {
    return `:no_entry: ${text}`
}

export function success(text: string): string {
    return `:white_check_mark: ${text}`
}
