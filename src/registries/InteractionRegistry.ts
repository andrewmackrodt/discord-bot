import type { InteractionBuilderWithInteraction } from './Interaction'
import { Interaction } from './Interaction'

export class InteractionRegistry {
    private readonly interactions: Record<string, Interaction> = {}

    public add(interaction: Interaction): Interaction
    public add(name: string, cb: (builder: InteractionBuilderWithInteraction) => Interaction): Interaction

    public add(interaction: Interaction | string, cb?: (builder: InteractionBuilderWithInteraction) => Interaction): Interaction {
        if (typeof interaction === 'string') {
            interaction = cb!(Interaction.builder().setInteraction(interaction))
        }
        return this.interactions[interaction.interaction] = interaction
    }

    public get(name: string): Interaction | null {
        return this.interactions[name] ?? null
    }
}
