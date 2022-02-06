import { Message } from 'discord.js'
import { Plugin, NextFunction } from '../../../types/plugins'
import axios from 'axios'
import cheerio from 'cheerio'

const randomComicUrl = 'https://c.xkcd.com/random/comic/'

export default class XkcdPlugin implements Plugin {
    public async onMessage(msg: Message, next: NextFunction): Promise<any> {
        if (msg.content.match(/!xkcd/i) === null) {
            return next()
        }

        const response = await axios.get<string>(randomComicUrl, {
            // todo see if setting user-agent helps with making requests quicker or just temporary internet issue
            headers: {
                'user-agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:74.0) Gecko/20100101 Firefox/74.0',
            },
        })

        const doc = cheerio.load(response.data).root()
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
