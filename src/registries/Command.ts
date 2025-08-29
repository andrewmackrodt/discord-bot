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
    lastArgIsText?: boolean
    args?: Record<string, CommandArgumentOptions>
    handler?: CommandHandler
    subcommands?: Record<string, Subcommand>
}

export interface CommandArgumentOptions {
    example?: string
    required?: boolean
}

export type CommandBuilderWithCommand = BuilderWithArgs<CommandOptions, typeof Command, 'command'>

export type Subcommand = Command & Required<Pick<Command, 'parent'>>

type CommandHandler = (message: Message<true>, ...args: string[]) => Promise<any>

export class Command {
    static builder(): Builder<CommandOptions, typeof Command> {
        return builder<CommandOptions, typeof Command>(Command)
    }

    readonly parent?: Command
    readonly command: string
    readonly emoji?: string
    readonly title?: string
    readonly description?: string
    readonly separator: string | RegExp | null
    readonly lastArgIsText: boolean
    readonly args: Record<string, CommandArgumentOptions>
    readonly subcommands: Record<string, Subcommand>

    handler?: CommandHandler

    constructor(options: CommandOptions) {
        this.parent = options?.parent
        this.command = options.command
        this.emoji = options?.emoji
        this.title = options?.title
        this.description = options?.description
        this.separator = typeof options?.separator === 'undefined' ? /\s+/ : options.separator
        this.lastArgIsText = options.lastArgIsText ?? false
        this.args = options?.args ?? {}
        this.handler = options?.handler
        this.subcommands = options?.subcommands ?? {}
    }

    get fullCommand(): string {
        const commands: string[] = []
        for (let c: Command | undefined = this; typeof c !== 'undefined'; c = c.parent) {
            commands.push(c.command)
        }
        return commands.reverse().join(' ')
    }

    execute(message: Message<true>, args: string[]): Promise<any> {
        return this.handler!(message, ...args)
    }
}
