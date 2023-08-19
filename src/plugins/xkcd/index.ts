import axios from 'axios'
import { load as cheerio } from 'cheerio'
import type { Message } from 'discord.js'
import type { Plugin, NextFunction } from '../../../types/plugins'

const randomComicUrl = 'https://c.xkcd.com/random/comic/'

export default class XkcdPlugin implements Plugin {
    public async onMessage(msg: Message, next: NextFunction): Promise<any> {
        if (msg.content.match(/!xkcd/i) === null) {
            return next()
        }

        const response = await axios.get<string>(randomComicUrl, {
            // todo see if setting user-agent helps with making requests quicker or just temporary internet issue
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
            },
        })

        const doc = cheerio(response.data).root()
        const title = doc.find('#ctitle').first().text() || 'Random XKCD Comic'
        let src = doc.find('#comic > img[src*="/comics/"]').first().attr('src')

        if (typeof src !== 'string') {
            return
        }

        if (src.match(/^\/\//)) {
            src = `https:${src}`
        }

        return msg.channel.send(src, { embed: { title, image: { url: src } } })
    }
}
