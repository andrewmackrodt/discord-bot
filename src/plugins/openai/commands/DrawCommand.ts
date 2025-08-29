import type { Message } from 'discord.js'
import { injectable } from 'tsyringe'

import { command } from '../../../utils/command'
import { OpenAIService } from '../services/OpenAIService'

@injectable()
export class DrawCommand {
    constructor(protected readonly openai: OpenAIService) {}

    @command('draw', {
        emoji: ':crayon:',
        title: 'Draw',
        description: 'Generate an image using DALL-E.',
        separator: null,
        args: {
            description: { required: true },
        },
    })
    async sendDrawResponse(message: Message<true>, description: string) {
        return this.openai.sendImageGenerationAndReply(message, description)
    }
}
