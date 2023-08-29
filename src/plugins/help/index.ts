import { Message } from 'discord.js'
import type { Plugin } from '../../../types/plugins'
import type { CommandRegistry } from '../../registries/CommandRegistry'
import { command } from '../../utils/command'

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
                    name: `.${c.command}`,
                    inline: true,
                    value: c.description?.replace(/[\s.]+$/, '').toLowerCase() ?? 'n/a',
                })),
            }],
        })
    }
}
