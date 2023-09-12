import type { Message } from 'discord.js'
import { injectable } from 'tsyringe'
import AskCommand from './commands/AskCommand'
import CyaCommand from './commands/CyaCommand'
import { DrawCommand } from './commands/DrawCommand'
import HaikuCommand from './commands/HaikuCommand'
import NewsCommand from './commands/NewsCommand'
import PoemCommand from './commands/PoemCommand'
import { OnThreadMessageHandler } from './events/OnThreadMessageHandler'
import type { NextFunction, Plugin } from '../../../types/plugins'

@injectable()
export default class OpenAIPlugin implements Plugin {
    public constructor(
        private readonly askCommand: AskCommand,
        private readonly cyaCommand: CyaCommand,
        private readonly drawCommand: DrawCommand,
        private readonly haikuCommand: HaikuCommand,
        private readonly newsCommand: NewsCommand,
        private readonly poemCommand: PoemCommand,
        private readonly onThreadMessageHandler: OnThreadMessageHandler,
    ) {
    }

    public getExtensions() {
        return [
            this.askCommand,
            this.cyaCommand,
            this.drawCommand,
            this.haikuCommand,
            this.newsCommand,
            this.poemCommand,
        ]
    }

    public onMessage(message: Message<true>, next: NextFunction) {
        return this.onThreadMessageHandler.onMessage(message, next)
    }
}
