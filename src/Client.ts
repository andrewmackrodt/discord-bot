import type { Message, MessageReaction, PartialUser, User, PartialMessageReaction, Interaction } from 'discord.js'
import Discord, { GatewayIntentBits } from 'discord.js'
import { dataSource } from './db'
import { Schedule } from './Schedule'
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

        return this.dispatch('onMessage', [message])
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

        return this.dispatch('onInteraction', [interaction])
    }
}
