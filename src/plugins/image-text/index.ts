import type { Message } from 'discord.js'
import { AttachmentBuilder } from 'discord.js'
import type { Image } from './functions'
import { createImage, images, UnknownImageError, TextCountError } from './functions'
import type { Plugin } from '../../../types/plugins'
import type { CommandArgumentOptions } from '../../registries/Command'
import { Command } from '../../registries/Command'
import type { CommandRegistry } from '../../registries/CommandRegistry'

export default class ImageTextPlugin implements Plugin {
    public async replyWithImage(message: Message, name: string, ...texts: string[]): Promise<any> {
        try {
            const image = await createImage(name, texts)
            const ext = image.name.split('.').pop()
            const attachment = new AttachmentBuilder(image.data, { name: `file.${ext}` })
            await message.channel.send({ files: [attachment] })
        } catch (e) {
            let content = ''
            if (e instanceof UnknownImageError) {
                const names = Object.keys(images).join(', ')
                content = `unknown image - must be one of: ${names}`
            } else if (e instanceof TextCountError) {
                const part = []
                for (let i = 1; i <= e.expected; i++) part.push(`text${i}`)
                const args = part.join('; ')
                content = `usage: \`!${name} ${args}\``
            } else {
                console.error('image-text: error', e)
                content = 'an unknown error occurred'
            }
            return message.reply(content)
        }
    }

    public doCommandRegistration(registry: CommandRegistry) {
        for (const k in images) {
            this.registerImageCommand(registry, k, images[k])
        }
    }

    private registerImageCommand(registry: CommandRegistry, name: string, image: Image) {
        const command = Command.builder()
            .command(name)
            .description(`${image.name.replaceAll('*', '\\*')} meme generator.`)
            .separator(';')
            .args(function () {
                const args: Record<string, CommandArgumentOptions> = {}
                for (let i = 1; i <= image.texts.length; i++) {
                    const name = image.texts.length === 1
                        ? 'text'
                        : `text${i}`
                    args[name] = { required: true }
                }
                return args
            }())
            .handler((message, ...args) => this.replyWithImage(message, name, ...args))
            .build()

        registry.add(command)
    }
}
