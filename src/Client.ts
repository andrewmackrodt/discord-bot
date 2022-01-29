import { Plugin } from '../types/plugins'
import Discord, { Message, MessageReaction, PartialUser, User } from 'discord.js'

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
    private _client?: Discord.Client

    public constructor(
        protected readonly token: string,
        protected readonly plugins: Plugin[],
    ) {
    }

    protected get client(): Discord.Client {
        if ( ! this._client) {
            this._client = new Discord.Client()
        }

        return this._client
    }

    public async start(): Promise<void> {
        this.client.on('error', this.onError)
        this.client.on('ready', this.onReady)
        this.client.on('message', this.onMessage)
        this.client.on('messageReactionAdd', this.onMessageReactionAdd)
        this.client.on('messageReactionRemove', this.onMessageReactionRemove)

        await this.client.login(this.token)
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

    protected onMessageReactionAdd = async (reaction: MessageReaction, user: User | PartialUser): Promise<void> => {
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

    protected onMessageReactionRemove = async (reaction: MessageReaction, user: User | PartialUser): Promise<void> => {
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
