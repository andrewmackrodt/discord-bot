import type { Message } from 'discord.js'
import { injectable } from 'tsyringe'
import AskCommand from './commands/AskCommand'
import HaikuCommand from './commands/HaikuCommand'
import NewsCommand from './commands/NewsCommand'
import PoemCommand from './commands/PoemCommand'
import { OnThreadMessageHandler } from './events/OnThreadMessageHandler'
import type { NextFunction, Plugin } from '../../../types/plugins'
import type { CommandRegistry } from '../../registries/CommandRegistry'
import type { InteractionRegistry } from '../../registries/InteractionRegistry'
import { registerCommandsFromDecorators } from '../../utils/command'
import { registerInteractionsFromDecorators } from '../../utils/interaction'

@injectable()
export default class OpenAIPlugin implements Plugin {
    public constructor(
        private readonly askCommand: AskCommand,
        private readonly haikuCommand: HaikuCommand,
        private readonly newsCommand: NewsCommand,
        private readonly poemCommand: PoemCommand,
        private readonly onThreadMessageHandler: OnThreadMessageHandler,
    ) {
    }

    protected get commands() {
        return [this.askCommand, this.haikuCommand, this.newsCommand, this.poemCommand]
    }

    public doCommandRegistration(registry: CommandRegistry) {
        this.commands.forEach(instance => registerCommandsFromDecorators(registry, instance))
    }

    public doInteractionRegistration(registry: InteractionRegistry) {
        this.commands.forEach(instance => registerInteractionsFromDecorators(registry, instance))
    }

    public onMessage(message: Message, next: NextFunction) {
        return this.onThreadMessageHandler.onMessage(message, next)
    }








}
