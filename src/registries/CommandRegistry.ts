import type { CommandBuilderWithCommand } from './Command'
import { Command } from './Command'

export class CommandRegistry {
    private readonly commands: Record<string, Command> = {}

    add(command: Command): Command
    add(name: string, cb: (builder: CommandBuilderWithCommand) => Command): Command
    add(command: Command | string, cb?: (builder: CommandBuilderWithCommand) => Command): Command {
        if (typeof command === 'string') {
            command = cb!(Command.builder().setCommand(command))
        }
        return (this.commands[command.command] = command)
    }

    list(): Command[] {
        return Object.values(this.commands)
    }

    get(name: string): Command | null {
        return this.commands[name] ?? null
    }

    getOrCreate(name: string): Command {
        return this.get(name) ?? this.add(name, (builder) => builder.build())
    }
}
