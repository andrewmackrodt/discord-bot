import axios from 'axios'
import { load as cheerio } from 'cheerio'
import { Message } from 'discord.js'
import { command } from '../../utils/command'

const randomComicUrl = 'https://c.xkcd.com/random/comic/'
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'

export default class XkcdPlugin {
    @command('xkcd', {
        emoji: ':newspaper:',
        title: 'xkcd',
        description: 'Fetches a random xkcd comic',
    })
    public async replyComic(message: Message): Promise<any> {
        const response = await axios.get<string>(randomComicUrl, { headers: { 'user-agent': userAgent } })
        const doc = cheerio(response.data).root()
        const title = doc.find('#ctitle').first().text() || 'Random xkcd comic'
        let src = doc.find('#comic > img[src*="/comics/"]').first().attr('src')

        if (typeof src !== 'string') {
            return
        }

        if (src.match(/^\/\//)) {
            src = `https:${src}`
        }

        return message.channel.send({
            content: src,
            embeds: [{ title, image: { url: src } }],
        })
    }
}
