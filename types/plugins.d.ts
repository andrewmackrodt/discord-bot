import type { Client, Message, MessageReaction, PartialMessageReaction, PartialUser, User , Interaction } from 'discord.js'
import type { CommandRegistry } from '../src/registries/CommandRegistry'
import type { InteractionRegistry } from '../src/registries/InteractionRegistry'
import type { Schedule } from '../src/Schedule'

export type NextFunction = (err?: string | Error) => Promise<any>

export type RegisterCommandsHandler = (registry: CommandRegistry) => void

export type RegisterInteractionsHandler = (registry: InteractionRegistry) => void

export type ConnectHandler = (client: Client) => any

export type MessageHandler = (message: Message<true>, next: NextFunction) => any

export type ReactionHandler = (
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
    next: NextFunction,
) => any

export type InteractionHandler = (interaction: Interaction, next: NextFunction) => any

export type RegisterScheduleHandler = (client: Client, scheduler: Schedule) => void

export interface Plugin {
    doCommandRegistration?: RegisterCommandsHandler
    doInteractionRegistration?: RegisterInteractionsHandler
    getExtensions?: () => object[]
    onConnect?: ConnectHandler
    onMessage?: MessageHandler
    onMessageReactionAdd?: ReactionHandler
    onMessageReactionRemove?: ReactionHandler
    onInteraction?: InteractionHandler
    registerScheduler?: RegisterScheduleHandler
}
