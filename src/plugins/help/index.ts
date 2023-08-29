import { Message } from 'discord.js'
import type { Plugin } from '../../../types/plugins'
import type { Command } from '../../registries/Command'
import type { CommandRegistry } from '../../registries/CommandRegistry'
import { command } from '../../utils/command'

function getFieldName(c: Command): string {
    let name = `.${c.command}`
    const args: string[] = []
    for (const [arg, options] of Object.entries(c.args)) {
        let str: string = options.example ?? arg
        if ( ! options.required) str += '?'
        args.push(`<${str}>`)
    }
    if (args.length > 0) {
        const separator = typeof c.separator === 'string'
            ? c.separator  + ' '
            : ' '
        name = name + ' ' + args.join(separator)
    }
    return name
}

export default class HelpPlugin implements Plugin {
    private commandRegistry?: CommandRegistry

    public doCommandRegistration(commandRegistry: CommandRegistry) {
        this.commandRegistry = commandRegistry
    }

    @command('help', {
        emoji: ':robot:',
        title: 'Bot Commands',
        description: 'Display help for bot commands.',
    })
    public async replyHelp(message: Message): Promise<any> {
        const commands = this.commandRegistry!.list()
            .sort((a, b) => a.command.localeCompare(b.command))
            .filter(c => c.command !== 'help')
        return message.channel.send({
            embeds: [{
                title: ':robot:  Bot Commands',
                fields: commands.map(c => ({
                    name: getFieldName(c),
                    inline: true,
                    value: c.description?.replace(/[\s.]+$/, '').toLowerCase() ?? 'n/a',
                })),
            }],
        })
    }
}
