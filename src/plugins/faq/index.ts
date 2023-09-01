import { injectable } from 'tsyringe'
import FaqAddCommand from './commands/FaqAddCommand'
import FaqDeleteCommand from './commands/FaqDeleteCommand'
import FaqGetCommand from './commands/FaqGetCommand'
import FaqListCommand from './commands/FaqListCommand'
import type { Plugin } from '../../../types/plugins'
import type { CommandRegistry } from '../../registries/CommandRegistry'
import { registerCommandsFromDecorators } from '../../utils/command'

@injectable()
export default class FaqPlugin implements Plugin {
    public constructor(
        private readonly faqAddCommand: FaqAddCommand,
        private readonly faListCommand: FaqListCommand,
        private readonly faqGetCommand: FaqGetCommand,
        private readonly faqDelCommand: FaqDeleteCommand,
    ) {
    }

    protected get commands() {
        return [this.faqAddCommand, this.faqGetCommand, this.faListCommand, this.faqDelCommand]
    }

    public doCommandRegistration(registry: CommandRegistry) {
        registry.add('faq', builder => builder
            .setEmoji(':grey_question:')
            .setTitle('FAQ')
            .setDescription('FAQ plugin.')
            .setArgs({ name: { required: true }, recipient: {} })
            .setHandler((message, name, recipient) => this.faqGetCommand.getFaq(message, name, recipient))
            .build())

        this.commands.forEach(instance => registerCommandsFromDecorators(registry, instance))
    }
}
