import {Message} from 'discord.js'

export type NextFunction = (err?: string | Error) => Promise<any>

export type Plugin = (msg: Message, next: NextFunction) => any
