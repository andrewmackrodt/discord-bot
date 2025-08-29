import type Discord from 'discord.js'

import { builder } from '../utils/builder'
import type { Builder, BuilderWithArgs } from '../utils/builder'

export interface InteractionOptions {
    interaction: string
    handler: InteractionHandler
}

export type InteractionBuilderWithInteraction = BuilderWithArgs<
    InteractionOptions,
    typeof Interaction,
    'interaction'
>

type InteractionHandler = (interaction: Discord.Interaction) => Promise<any>

export class Interaction {
    static builder(): Builder<InteractionOptions, typeof Interaction> {
        return builder<InteractionOptions, typeof Interaction>(Interaction)
    }

    readonly interaction: string

    handler: InteractionHandler

    constructor(options: InteractionOptions) {
        this.interaction = options.interaction
        this.handler = options?.handler
    }

    execute(interaction: Discord.Interaction): Promise<any> {
        return this.handler(interaction)
    }
}
