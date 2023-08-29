import type { CommandBuilderWithCommand } from './Command'
import { Command } from './Command'

export class CommandRegistry {
    private readonly commands: Record<string, Command> = {}

    public add(command: Command): Command
    public add(name: string, cb: (builder: CommandBuilderWithCommand) => Command): Command

    public add(command: Command | string, cb?: (builder: CommandBuilderWithCommand) => Command): Command {
        if (typeof command === 'string') {
            command = cb!(Command.builder().command(command))
        }
        return this.commands[command.command] = command
    }

    public list(): Command[] {
        return Object.values(this.commands)
    }

    public get(name: string): Command | null {
        return this.commands[name] ?? null
    }

    public getOrCreate(name: string): Command {
        return this.get(name) ?? this.add(name, builder => builder.build())
    }
}
