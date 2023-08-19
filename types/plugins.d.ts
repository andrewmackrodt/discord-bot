import type { Client, Message, MessageReaction, PartialUser, User } from 'discord.js'
import type { Schedule } from '../src/Schedule'

export type NextFunction = (err?: string | Error) => Promise<any>

export type ConnectHandler = (client: Client) => any

export type MessageHandler = (msg: Message, next: NextFunction) => any

export type ReactionHandler = (reaction: MessageReaction, user: User | PartialUser, next: NextFunction) => any

export type RegisterScheduleHandler = (client: Client, scheduler: Schedule) => void

export interface Plugin {
    onConnect?: ConnectHandler
    onMessage?: MessageHandler
    onMessageReactionAdd?: ReactionHandler
    onMessageReactionRemove?: ReactionHandler
    registerScheduler?: RegisterScheduleHandler
}
