import { Client, Message } from 'discord.js'

export type NextFunction = (err?: string | Error) => Promise<any>

export type ConnectHandler = (client: Client) => any

export type MessageHandler = (msg: Message, next: NextFunction) => any

export interface Plugin {
    onConnect?: ConnectHandler
    onMessage?: MessageHandler
}
