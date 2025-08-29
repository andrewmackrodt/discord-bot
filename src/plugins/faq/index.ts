import { injectable } from 'tsyringe'

import FaqAddCommand from './commands/FaqAddCommand'
import FaqDeleteCommand from './commands/FaqDeleteCommand'
import FaqGetCommand from './commands/FaqGetCommand'
import FaqListCommand from './commands/FaqListCommand'
import type { Plugin } from '../../../types/plugins'
import type { CommandRegistry } from '../../registries/CommandRegistry'

@injectable()
export default class FaqPlugin implements Plugin {
    constructor(
        private readonly faqAddCommand: FaqAddCommand,
        private readonly faListCommand: FaqListCommand,
        private readonly faqGetCommand: FaqGetCommand,
        private readonly faqDelCommand: FaqDeleteCommand,
    ) {}

    getExtensions() {
        return [
            this.faqAddCommand,
            this.faqGetCommand,
            this.faListCommand,
            this.faqDelCommand,
        ]
    }

    doCommandRegistration(registry: CommandRegistry) {
        registry.add('faq', (builder) =>
            builder
                .setEmoji(':grey_question:')
                .setTitle('FAQ')
                .setDescription('FAQ plugin.')
                .setArgs({ name: { required: true }, recipient: {} })
                .setHandler((message, name, recipient) =>
                    this.faqGetCommand.getFaq(message, name, recipient),
                )
                .build(),
        )
    }
}
