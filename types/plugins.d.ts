import type { Client, Message, MessageReaction, PartialMessageReaction, PartialUser, User , Interaction } from 'discord.js'
import type { Schedule } from '../src/Schedule'

export type NextFunction = (err?: string | Error) => Promise<any>

export type ConnectHandler = (client: Client) => any

export type MessageHandler = (msg: Message, next: NextFunction) => any

export type InteractionHandler = (interaction: Interaction, next: NextFunction) => any

export type ReactionHandler = (
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
    next: NextFunction,
) => any

export type RegisterScheduleHandler = (client: Client, scheduler: Schedule) => void

export interface Plugin {
    onConnect?: ConnectHandler
    onMessage?: MessageHandler
    onInteraction?: InteractionHandler
    onMessageReactionAdd?: ReactionHandler
    onMessageReactionRemove?: ReactionHandler
    registerScheduler?: RegisterScheduleHandler
}
