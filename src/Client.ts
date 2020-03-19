import { MessageHandler, Plugin } from '../types/plugins'
import Discord, { Message } from 'discord.js'

type ErrorType = Error | string

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
        this.client.on('error', (error: ErrorType) => this.onError(error))
        this.client.on('ready', () => this.onReady())
        this.client.on('message', (message: Message) => this.onMessage(message))
        await this.client.login(this.token)
    }

    protected async onError(error: ErrorType): Promise<void> {
        console.error(error)
    }

    protected async onReady(): Promise<void> {
        console.info(`Logged in as ${this.client.user!.tag}!`)

        for (const plugin of this.plugins) {
            if ( ! plugin.onConnect) {
                continue
            }

            void plugin.onConnect(this.client)
        }
    }

    protected async onMessage(message: Message): Promise<void> {
        if ( ! message.guild) {
            return
        }

        const stack = this.plugins.filter(x => x.onMessage) as (Plugin & Required<Pick<Plugin, 'onMessage'>>)[]

        if (stack.length === 0) {
            return
        }

        const dispatch = (plugin: MessageHandler): Promise<any> => {
            return plugin(message, async (err?: string | Error): Promise<any> => {
                if ( ! err) {
                    const sibling = stack.shift()
                    if (sibling) {
                        return dispatch(sibling.onMessage)
                    }
                } else {
                    console.error(err)
                }
            })
        }

        return dispatch(stack.shift()!.onMessage)
    }
}
