import type { InteractionBuilderWithInteraction } from './Interaction'
import { Interaction } from './Interaction'

export class InteractionRegistry {
    private readonly interactions: Record<string, Interaction> = {}

    add(interaction: Interaction): Interaction
    add(name: string, cb: (builder: InteractionBuilderWithInteraction) => Interaction): Interaction
    add(
        interaction: Interaction | string,
        cb?: (builder: InteractionBuilderWithInteraction) => Interaction,
    ): Interaction {
        if (typeof interaction === 'string') {
            interaction = cb!(Interaction.builder().setInteraction(interaction))
        }
        return (this.interactions[interaction.interaction] = interaction)
    }

    get(name: string): Interaction | null {
        return this.interactions[name] ?? null
    }
}
