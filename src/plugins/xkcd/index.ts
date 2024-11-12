import type { AxiosResponse } from 'axios'
import axios, { AxiosError } from 'axios'
import { load as cheerio } from 'cheerio'
import { ButtonStyle, EmbedBuilder, Message } from 'discord.js'
import { command, CommandUsageError } from '../../utils/command'
import { sendErrorToChannel, sendGenericErrorToChannel } from '../../utils/plugin'

const comicByIdUrl = 'https://xkcd.com/:id/'
const randomComicUrl = 'https://c.xkcd.com/random/comic/'
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

export default class XkcdPlugin {
    @command('xkcd', {
        emoji: ':newspaper:',
        title: 'xkcd',
        description: 'Fetch a comic from xkcd.',
        args: {
            id: {},
        },
    })
    public async replyComic(message: Message<true>, id?: string): Promise<any> {
        let getComicURL: string

        if (typeof id === 'string') {
            if (id === 'latest') {
                getComicURL = comicByIdUrl.replace(':id/', '')
            } else {
                if (isNaN(parseInt(id)) || parseInt(id) < 1) {
                    throw new CommandUsageError('xkcd', 'id must be "latest" or a positive number')
                }
                getComicURL = comicByIdUrl.replace(':id', id)
            }

        } else {
            getComicURL = randomComicUrl
        }

        let response: AxiosResponse

        try {
            response = await axios.get<string>(getComicURL, { headers: { 'user-agent': userAgent } })
        } catch (e) {
            if (e instanceof AxiosError && e.code === 'ERR_BAD_REQUEST') {
                return sendErrorToChannel(message, '404 Comic Not Found')
            }
            console.error('xkcd: error', e)
            return sendGenericErrorToChannel(message)
        }

        let comicURL = response.request.res.responseUrl
        const doc = cheerio(response.data).root()
        const title = doc.find('#ctitle').first().text() || 'xkcd comic'
        const img = doc.find('#comic img[src*="/comics/"]').first()
        let imageURL = img.attr('src')

        if ( ! comicURL || typeof imageURL !== 'string') {
            return sendGenericErrorToChannel(message)
        }

        if (imageURL.startsWith('//')) {
            imageURL = `https:${imageURL}`
        }

        if (id === 'latest') {
            const metaURL = doc.find('meta[property="og:url"]').first().attr('content')?.trim()
            if (metaURL) {
                comicURL = metaURL.startsWith('//') ? `https:${metaURL}` : metaURL
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setURL(comicURL)
            .setImage(imageURL)

        const caption = img.attr('title')?.trim()

        if (caption) {
            embed.setDescription(`||${caption}||`)
        }

        return message.channel.send({ embeds: [embed] })
    }
}
