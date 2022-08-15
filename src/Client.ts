import type { Message, MessageReaction, PartialUser, User , PartialMessageReaction } from 'discord.js'
import Discord, { GatewayIntentBits } from 'discord.js'
import { dataSource } from './db'
import { Schedule } from './Schedule'
import type { Plugin } from '../types/plugins'

type ErrorType = Error | string

type PluginHasEvent<T extends keyof Plugin> = Plugin & Required<Pick<Plugin, T>>

type MessagePlugin = PluginHasEvent<'onMessage'>
type MessageReactionAddPlugin = PluginHasEvent<'onMessageReactionAdd'>
type MessageReactionRemovePlugin = PluginHasEvent<'onMessageReactionRemove'>

const forward = <T extends Plugin>(dispatch: (plugin: T) => any, stack: T[]) => {
    return async (err?: string | Error): Promise<any> => {
        if ( ! err) {
            const sibling = stack.shift()
            if (sibling) {
                return dispatch(sibling)
            }
        } else {
            console.error(err)
        }
    }
}

export class Client {
    protected readonly client: Discord.Client
    protected readonly schedule = new Schedule()

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
        this.client.on('messageCreate', this.onMessage)
        this.client.on('messageReactionAdd', this.onMessageReactionAdd)
        this.client.on('messageReactionRemove', this.onMessageReactionRemove)

        // connect to discord
        await this.client.login(this.token)
    }

    protected cleanup = async (): Promise<void> => {
        await this.schedule.shutdown()

        // close discord connection
        try {
            this.client.destroy()
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

    protected onMessage = async (message: Message): Promise<void> => {
        if (message.author.bot || ! message.guild) {
            return
        }

        const stack = this.plugins.filter(p => p.onMessage) as MessagePlugin[]

        if (stack.length === 0) {
            return
        }

        const dispatch = async (plugin: MessagePlugin): Promise<any> => {
            return plugin.onMessage(message, forward(dispatch, stack))
        }

        try {
            await dispatch(stack.shift()!)
        } catch (err) {
            console.error(err)
        }
    }

    protected onMessageReactionAdd = async (
        reaction: MessageReaction | PartialMessageReaction,
        user: User | PartialUser,
    ): Promise<void> => {
        if (user.bot || ! reaction.message.guild) {
            return
        }

        const stack = this.plugins.filter(x => x.onMessageReactionAdd) as MessageReactionAddPlugin[]

        if (stack.length === 0) {
            return
        }

        const dispatch = async (plugin: MessageReactionAddPlugin): Promise<any> => {
            return plugin.onMessageReactionAdd(reaction, user, forward(dispatch, stack))
        }

        try {
            await dispatch(stack.shift()!)
        } catch (err) {
            console.error(err)
        }
    }

    protected onMessageReactionRemove = async (
        reaction: MessageReaction | PartialMessageReaction,
        user: User | PartialUser,
    ): Promise<void> => {
        if (user.bot || ! reaction.message.guild) {
            return
        }

        const stack = this.plugins.filter(x => x.onMessageReactionRemove) as MessageReactionRemovePlugin[]

        if (stack.length === 0) {
            return
        }

        const dispatch = async (plugin: MessageReactionRemovePlugin): Promise<any> => {
            return plugin.onMessageReactionRemove(reaction, user, forward(dispatch, stack))
        }

        try {
            await dispatch(stack.shift()!)
        } catch (err) {
            console.error(err)
        }
    }
}
