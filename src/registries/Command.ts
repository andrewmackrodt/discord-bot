import type { Message } from 'discord.js'
import { builder } from '../utils/builder'
import type { Builder, BuilderWithArgs } from '../utils/builder'

export interface CommandOptions {
    parent?: Command
    command: string
    emoji?: string
    title?: string
    description?: string
    separator?: string | RegExp | null
    args?: Record<string, CommandArgumentOptions>
    handler?: CommandHandler
    subcommands?: Record<string, Subcommand>
}

export interface CommandArgumentOptions {
    example?: string
    required?: boolean
}

export type CommandBuilderWithCommand = BuilderWithArgs<CommandOptions, typeof Command, 'command'>

type CommandHandler = (message: Message, ...args: string[]) => Promise<any>

export type Subcommand = Command & Required<Pick<Command, 'parent'>>

export class Command {
    public readonly parent?: Command
    public readonly command: string
    public readonly emoji?: string
    public readonly title?: string
    public readonly description?: string
    public readonly separator: string | RegExp | null
    public readonly args: Record<string, CommandArgumentOptions>
    public handler?: CommandHandler
    public readonly subcommands: Record<string, Subcommand>

    public static builder<T>(): Builder<CommandOptions, typeof Command> {
        return builder<CommandOptions, typeof Command>(Command)
    }

    public constructor(options: CommandOptions) {
        this.parent = options?.parent
        this.command = options.command
        this.emoji = options?.emoji
        this.title = options?.title
        this.description = options?.description
        this.separator = typeof options?.separator === 'undefined' ? /\s+/ : options.separator
        this.args = options?.args ?? {}
        this.handler = options?.handler
        this.subcommands = options?.subcommands ?? {}
    }

    public get fullCommand(): string {
        const commands: string[] = []
        for (
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            let c: Command | undefined = this;
            typeof c !== 'undefined';
            c = c.parent
        ) {
            commands.push(c.command)
        }
        return commands.reverse().join(' ')
    }

    public execute(message: Message, args: string[]): Promise<any> {
        return this.handler!(message, ...args)
    }
}
