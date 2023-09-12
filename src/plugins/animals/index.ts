import axios from 'axios'
import type { Message } from 'discord.js'
import type { Plugin } from '../../../types/plugins'
import { Command } from '../../registries/Command'
import type { CommandRegistry } from '../../registries/CommandRegistry'
import { sendGenericErrorToChannel } from '../../utils/plugin'

interface AnimalResponse {
    success: boolean
    status: number
    info: {
        category: string
        endpoint: string
    }
    message: string
}

enum Animal {
    Alpaca = 'alpaca',
    Bird = 'bird',
    Cat = 'cat',
    Dog = 'dog',
    Fish = 'fish',
    Fox = 'fox',
}

const baseUrl = 'https://api.sefinek.net/api/v2/random/animal'

export default class AnimalsPlugin implements Plugin {
    public async replyWithImage(message: Message<true>, animal: Animal): Promise<any> {
        let data: AnimalResponse
        const url = `${baseUrl}/${animal}`
        try {
            const response = await axios.get<AnimalResponse>(url)
            data = response.data
            if ( ! data.success) {
                console.error('error: animals', data)
                return sendGenericErrorToChannel(message)
            }
        } catch (e) {
            console.error('error: animals', e)
            return sendGenericErrorToChannel(message)
        }
        return message.channel.send(data.message)
    }

    public doCommandRegistration(registry: CommandRegistry) {
        for (const animal of Object.values(Animal)) {
            this.registerImageCommand(registry, animal)
        }
    }

    private registerImageCommand(registry: CommandRegistry, animal: Animal) {
        const command = Command.builder()
            .setCommand(animal)
            .setDescription(`Fetch a random ${animal} image.`)
            .setHandler(message => this.replyWithImage(message, animal))
            .build()

        registry.add(command)
    }
}
