import { Interaction } from '../registries/Interaction'
import type { InteractionRegistry } from '../registries/InteractionRegistry'

interface DecoratorRegistration {
    interaction: string
    method: string
}

const registered: Record<string, DecoratorRegistration[]> = {}

export function interaction(interaction: string) {
    return <T extends object>(target: T, propertyKey: keyof T, descriptor: PropertyDescriptor) => {
        const name = target.constructor.name
        if ( ! (name in registered)) {
            registered[name] = []
        }
        registered[name].push({
            interaction,
            method: propertyKey as string,
        })
    }
}

export function registerInteractionsFromDecorators<T>(registry: InteractionRegistry, instance: T) {
    const cname = Object.getPrototypeOf(instance).constructor.name

    if (! (cname in registered)) {
        return
    }

    const createInteractionFromDecorator = (interaction: string, method: string): Interaction => {
        return new Interaction({
            ...{
                interaction,
                // @ts-expect-error TS7053
                handler: (interaction) => instance[method](interaction),
            },
        })
    }

    for (const reg of Object.values(registered[cname])) {
        if (registry.get(reg.interaction)) {
            console.error(
                `interaction registration error: "${reg.interaction}" is already registered` +
                `; registration from ${cname} will be ignored`)
            continue
        }

        registry.add(createInteractionFromDecorator(reg.interaction, reg.method))
    }
}
