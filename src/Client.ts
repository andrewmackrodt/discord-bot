import type { Message, MessageReaction, PartialUser, User, PartialMessageReaction, Interaction } from 'discord.js'
import Discord, { GatewayIntentBits } from 'discord.js'
import { dataSource } from './db'
import type { Command } from './registries/Command'
import { CommandRegistry } from './registries/CommandRegistry'
import { InteractionRegistry } from './registries/InteractionRegistry'
import { Schedule } from './Schedule'
import { CommandUsageError, registerCommandsFromDecorators } from './utils/command'
import { registerInteractionsFromDecorators } from './utils/interaction'
import { replyWithCommandHelp } from './utils/plugin'
import { split } from './utils/string'
import type { NextFunction, Plugin } from '../types/plugins'

type PluginEvent = 'onMessage' | 'onMessageReactionAdd' | 'onMessageReactionRemove' | 'onInteraction'

type PluginHasEvent<T extends PluginEvent> = Required<Pick<Plugin, T>>

type FilterNextFunction<T extends unknown[]> = T extends [...infer H, infer R]
    ? R extends NextFunction ? [...H] : [T]
    : [T]

type PluginEventParameters<T extends PluginEvent>
    = FilterNextFunction<Parameters<Exclude<PluginHasEvent<T>[T], undefined>>>

type ErrorType = Error | string

export class Client {
    protected readonly client: Discord.Client
    protected readonly commandRegistry: CommandRegistry
    protected readonly interactionRegistry: InteractionRegistry
    protected readonly schedule = new Schedule()

    protected readonly eventHandlers: Record<PluginEvent, Plugin[]> = {
        onMessage: [],
        onMessageReactionAdd: [],
        onMessageReactionRemove: [],
        onInteraction: [],
    }

    public constructor(
        protected readonly token: string,
        protected readonly plugins: Plugin[],
    ) {
        this.client = new Discord.Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.MessageContent,
            ],
        })

        this.commandRegistry = new CommandRegistry()
        this.interactionRegistry = new InteractionRegistry()

        const events: PluginEvent[] = [
            'onMessage',
            'onMessageReactionAdd',
            'onMessageReactionRemove',
            'onInteraction',
        ]

        for (const plugin of plugins)
        for (const e of events) {
            if (plugin[e]) {
                this.eventHandlers[e].push(plugin)
            }
        }
    }

    public async start(): Promise<void> {
        // gracefully close connections on exit
        process.on('SIGINT', this.cleanup)
        process.on('SIGTERM', this.cleanup)

        // create database connection and run migrations
        await dataSource.initialize()
        await dataSource.runMigrations()

        // register commands and interactions
        for (const plugin of this.plugins) {
            this.doCommandRegistration(plugin)
            this.doInteractionRegistration(plugin)
        }

        // assign handler functions
        this.client.on('error', this.onError)
        this.client.on('ready', this.onReady)

        if (this.eventHandlers['onMessage']) this.client.on('messageCreate', this.onMessage)
        if (this.eventHandlers['onMessageReactionAdd']) this.client.on('messageReactionAdd', this.onMessageReactionAdd)
        if (this.eventHandlers['onMessageReactionRemove']) this.client.on('messageReactionRemove', this.onMessageReactionRemove)
        if (this.eventHandlers['onInteraction']) this.client.on('interactionCreate', this.onInteraction)

        // connect to discord
        await this.client.login(this.token)
    }

    protected cleanup = async (): Promise<void> => {
        await this.schedule.shutdown()

        // close discord connection
        try {
            await this.client.destroy()
        } catch (e) {
            console.error(e)
        }

        // close db connection
        if (dataSource.isInitialized) {
            try {
                await dataSource.destroy()
            } catch (e) {
                console.error(e)
            }
        }

        process.exit(0)
    }

    protected onError = async (error: ErrorType): Promise<void> => {
        console.error(error)
    }

    protected onReady = async (): Promise<void> => {
        console.info(`Logged in as ${this.client.user!.tag}!`)

        for (const plugin of this.plugins) {
            if ( ! plugin.onConnect) {
                continue
            }

            void plugin.onConnect(this.client)
        }

        for (const plugin of this.plugins) {
            if ( ! plugin.registerScheduler) {
                continue
            }

            void plugin.registerScheduler(this.client, this.schedule)
        }
    }

    protected dispatch = async <T extends PluginEvent>(
        event: T,
        args: PluginEventParameters<T>,
    ): Promise<void> => {
        for (const plugin of this.eventHandlers[event]) {
            let isNext = false
            // @ts-expect-error TS2556
            await plugin[event]!(...args, err => {
                if ( ! err) {
                    isNext = true
                } else {
                    console.error(err)
                }
            })
            if ( ! isNext) {
                break
            }
        }
    }

    protected onMessage = async (message: Message): Promise<void> => {
        if (message.author.bot || ! message.guild) {
            return
        }

        // if message starts with "." it may be a command, determine if the first
        // word matches a command in the CommandRegistry and delegate handling of
        // the message to the registered function in the registry.
        if (message.content.match(/^[#!.-]/)) {
            const isHandledByCommand = await this.tryHandleCommand(message)
            if (isHandledByCommand) {
                return
            }
        }

        // otherwise dispatch the message to plugins which implement onMessage
        return this.dispatch('onMessage', [message])
    }

    protected tryHandleCommand = async (message: Message): Promise<boolean> => {
        const match = message.content.match(/^[#!.-]([a-z0-9][a-z0-9_-]+)\b/i)

        if ( ! match) {
            return false
        }

        let command = this.commandRegistry.get(match[1]) as Command

        if ( ! command) {
            return false
        }

        let content = message.content.replace(/^\S+\s*/, '')

        while (Object.keys(command!.subcommands).length > 0) {
            const word = content.split(/\s/, 1)[0]

            if ( ! word) {
                void replyWithCommandHelp(message, command, 'missing subcommand')
                return true
            }

            const subcommand = command.subcommands[word]

            if ( ! subcommand) {
                void replyWithCommandHelp(message, command, `unknown subcommand "${word}"`)
                return true
            }

            command = subcommand
            content = content.replace(/^\S+\s*/, '')
        }

        const minArgsLength = Object.values(command.args).filter(a => a.required).length
        const maxArgsLength = Object.keys(command.args).length
        let args: string[] = []

        if (content) {
            if (command.separator) {
                if (command.lastArgIsText) {
                    const limit = maxArgsLength - 1
                    args = split(content, command.separator, limit)
                } else {
                    args = content.split(command.separator).map(s => s.trim()).filter(s => s.length > 0)
                }
            } else {
                args.push(content.trim())
            }
        }

        if (maxArgsLength < args.length || args.length < minArgsLength) {
            void replyWithCommandHelp(message, command, 'incorrect number of arguments')
            return true
        }

        try {
            await command.execute(message, args)
        } catch (e) {
            if ( ! (e instanceof CommandUsageError)) {
                throw e
            }

            void replyWithCommandHelp(message, command, e.message)
        }

        return true
    }

    protected onMessageReactionAdd = async (
        reaction: MessageReaction | PartialMessageReaction,
        user: User | PartialUser,
    ): Promise<void> => {
        if (user.bot || ! reaction.message.guild) {
            return
        }

        return this.dispatch('onMessageReactionAdd', [reaction, user])
    }

    protected onMessageReactionRemove = async (
        reaction: MessageReaction | PartialMessageReaction,
        user: User | PartialUser,
    ): Promise<void> => {
        if (user.bot || ! reaction.message.guild) {
            return
        }

        return this.dispatch('onMessageReactionRemove', [reaction, user])
    }

    protected onInteraction = async (interaction: Interaction): Promise<void> => {
        if (interaction.user.bot || ! interaction.guild) {
            return
        }

        if ('customId' in interaction) {
            const hnd = this.interactionRegistry.get(interaction.customId)
            if (hnd) {
                return hnd.execute(interaction)
            }
        }

        return this.dispatch('onInteraction', [interaction])
    }

    private doCommandRegistration(plugin: Plugin) {
        // call Plugin.doCommandRegistration to perform class based command registration
        if (plugin.doCommandRegistration) {
            plugin.doCommandRegistration(this.commandRegistry)
        }

        // proceed to register commands added using decorators
        registerCommandsFromDecorators(this.commandRegistry, plugin)
    }

    private doInteractionRegistration(plugin: Plugin) {
        // call Plugin.doInteractionRegistration to perform class based command registration
        if (plugin.doInteractionRegistration) {
            plugin.doInteractionRegistration(this.interactionRegistry)
        }

        // proceed to register interactions added using decorators
        registerInteractionsFromDecorators(this.interactionRegistry, plugin)
    }
}
