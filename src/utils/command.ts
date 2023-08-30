import type { CommandOptions, Subcommand } from '../registries/Command'
import { Command } from '../registries/Command'
import type { CommandRegistry } from '../registries/CommandRegistry'

export type DecoratorOptions = Pick<CommandOptions,
    'emoji' |
    'title' |
    'description' |
    'separator' |
    'lastArgIsText' |
    'args' >

interface DecoratorRegistration {
    command: string
    method: string
    options?: DecoratorOptions
}

export class CommandUsageError extends Error {
    public constructor(
        protected readonly command: Command | string,
        message?: string,
    ) {
        super(message)
    }
}

const registered: Record<string, DecoratorRegistration[]> = {}

export function command(command: string, options?: DecoratorOptions) {
    return <T extends object>(target: T, propertyKey: keyof T, descriptor: PropertyDescriptor) => {
        const name = target.constructor.name
        if ( ! (name in registered)) {
            registered[name] = []
        }
        registered[name].push({
            command,
            method: propertyKey as string,
            options,
        })
    }
}

export function registerCommandsFromDecorators<T>(registry: CommandRegistry, instance: T) {
    const cname = Object.getPrototypeOf(instance).constructor.name

    if (! (cname in registered)) {
        return
    }

    const createCommand = (
        command: string,
        method: string,
        options?: DecoratorOptions,
        parent?: Command | undefined,
    ): Command | Subcommand => {
        return new Command({
            ...options,
            ...{
                parent,
                command,
                // @ts-expect-error TS7053
                handler: (message, ...args) => instance[method](message, ...args),
            },
        })
    }

    for (const reg of Object.values(registered[cname])) {
        const words = reg.command.trim().split(/[ \t]+/)
        let command: Command

        if (words.length > 1) {
            command = registry.getOrCreate(words[0])
            let i = 1

            for (let len = words.length - 1; i < len; i++) {
                const word = words[i]

                if (! (word in command.subcommands)) {
                    command.subcommands[word] = Command.builder().parent(command).command(word).build()
                }

                command = command.subcommands[word]
            }

            const word = words[i]

            if (word in command.subcommands) {
                console.error(
                    `command registration error: "${reg.command}" is already registered` +
                    `; registration from ${cname} will be ignored`)
                continue
            }

            command.subcommands[word] = createCommand(word, reg.method, reg.options, command) as Subcommand
        } else {
            if (registry.get(words[0])) {
                console.error(
                    `command registration error: "${reg.command}" is already registered` +
                    `; registration from ${cname} will be ignored`)
                continue
            }

            registry.add(createCommand(words[0], reg.method, reg.options))
        }
    }
}
