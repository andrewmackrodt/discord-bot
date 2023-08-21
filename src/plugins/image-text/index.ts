import type { Message } from 'discord.js'
import { createImage, images, UnknownImageError, TextCountError } from './functions'
import type { Plugin, NextFunction } from '../../../types/plugins'

const regExp = new RegExp('^!(' + Object.keys(images).join('|') + ')')

export default class ImageTextPlugin implements Plugin {
    public async onMessage(msg: Message, next: NextFunction): Promise<any> {
        const match = regExp.exec(msg.content)

        if ( ! match) {
            return next()
        }

        const name = match[1]
        const texts = msg.content.replace(/^![a-z]+[ \t]+/, '').split(';').map(t => t.trim()).filter(t => t.length > 0)

        try {
            const buffer = await createImage(name, texts)
            await msg.channel.send({ files: [buffer] })
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
            return msg.reply(content)
        }
    }
}
