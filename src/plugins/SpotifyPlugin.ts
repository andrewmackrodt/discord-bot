import Discord, { Message, MessageReaction, PartialUser } from 'discord.js'
import { NextFunction, Plugin } from '../../types/plugins'
import { Song } from '../models/Song'
import SpotifyWebApi from 'spotify-web-api-node'
import { User } from '../models/User'
import { toMarkdownTable } from '../utils/string-utils'

const trackIdRegExp = new RegExp(/\bspotify.com\/track\/([A-Za-z0-9_-]{10,})\b|^([A-Za-z0-9_-]{10,})$/)

interface CommandHelp {
    title: string
    usage: string
}

const commandsHelp: Record<string, CommandHelp> = {
    add: {
        title: 'add a new song of the day',
        usage: '#sotd add https://open.spotify.com/track/70cI6K8qorn5eOICHkUo95',
    },
    history: {
        title: 'show song of the day history',
        usage: '#sotd history',
    },
    random: {
        title: 'fetch a random previously entered song of the day',
        usage: '#sotd random',
    },
    stats: {
        title: 'display sotd stats',
        usage: '#sotd stats',
    },
}

const helpText = ':notepad_spiral: **Song of the Day Help**\n\n' +
    Object.values(commandsHelp)
        .map(obj => `> **${obj.title}**:\n> \`${obj.usage}\``)
        .join('\n> \n')

const historyLimit = 5

function error(text: string): string {
    return `:no_entry: ${text}`
}

function success(text: string): string {
    return `:white_check_mark: ${text}`
}

export default class SpotifyPlugin implements Plugin {
    private _clientUserId?: string
    private _spotify?: SpotifyWebApi
    private _tokenExpiresAt = new Date(1970, 0, 1, 0, 0, 0, 0)

    protected get isSupported(): boolean {
        return Boolean(this._spotify)
    }

    public constructor() {
        if ( ! Boolean(
            process.env.SPOTIFY_CLIENT_ID &&
            process.env.SPOTIFY_CLIENT_SECRET &&
            process.env.SPOTIFY_REFRESH_TOKEN &&
            process.env.SPOTIFY_PLAYLIST_ID,
        )) {
            return
        }

        this._spotify = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            redirectUri: 'http://localhost:8080',
            refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
        })
    }

    protected async spotify(): Promise<SpotifyWebApi> {
        if ( ! this._spotify) {
            throw new Error('spotify is disabled')
        }

        if (this._tokenExpiresAt <= new Date()) {
            try {
                const { body: tokenResponse } = await this._spotify.refreshAccessToken()
                this._spotify.setAccessToken(tokenResponse.access_token)
                this._tokenExpiresAt = new Date()
                this._tokenExpiresAt.setSeconds(this._tokenExpiresAt.getSeconds() + tokenResponse.expires_in - 30)
            } catch (e) {
                delete this._spotify
                throw e
            }
        }

        return this._spotify
    }

    public async onConnect(client: Discord.Client): Promise<unknown> {
        this._clientUserId = client.user?.id

        if ( ! this.isSupported) {
            return
        }

        const spotify = await this.spotify()
        const { body: user } = await spotify.getMe()

        console.info('spotify: authenticated as', user.id)
    }

    public async onMessage(message: Message, next: NextFunction): Promise<unknown> {
        const words = message.content.split(/[ \t]+/)
        const [tag, command, ...options] = words

        if (tag !== '#sotd') {
            return next()
        }

        if ( ! this.isSupported) {
            return message.channel.send(
                error('the spotify plugin is not correctly configured, please contact the server admin'),
            )
        }

        switch (command) {
            case 'help':
                return this.help(options, message)
            case 'add':
                return this.add(options, message)
            case 'history':
                return this.history(message)
            case 'random':
                return this.random(message)
            case 'stats':
                return this.stats(message)
            default:
                return this.help([command], message)
        }
    }

    protected async sendCommandHelp(
        message: Message,
        { title, usage }: CommandHelp,
        isSyntaxError = false,
    ): Promise<Discord.Message> {
        let response = `> **${title}**\n> \`${usage}\``

        if (isSyntaxError) {
            response = error('the command contains a syntax error') + `\n\n${response}`
        }

        return message.channel.send(response)
    }

    protected async help(options: string[], message: Message): Promise<Discord.Message> {
        let replyPrefix = ''

        if (options.length > 0) {
            const [command] = options
            const help = commandsHelp[command]

            if (help) {
                return this.sendCommandHelp(message, help)
            }

            replyPrefix = error(`unknown command: ${command}`) + '\n\n'
        }

        return message.channel.send(replyPrefix + helpText)
    }

    protected async add(options: string[], message: Message): Promise<Discord.Message> {
        const url = options[0] ?? ''
        const trackIdMatch = trackIdRegExp.exec(url)

        if ( ! url || ! (trackIdMatch )) {
            return this.sendCommandHelp(message, commandsHelp.add, true)
        }

        const trackId = trackIdMatch[1] ?? trackIdMatch[2]

        if ( ! await this.isTrackIdUnique(trackId)) {
            return message.channel.send(error('song of the day must be unique'))
        }

        try {
            // create entry in database
            const user = await this.getOrCreateUser(message.author)
            const song = await this.addSongOfTheDay(trackId, user)

            // create entry in playlist
            const spotify = await this.spotify()
            const { body: res } = await spotify.addTracksToPlaylist(process.env.SPOTIFY_PLAYLIST_ID!, [
                `spotify:track:${trackId}`,
            ])

            return message.channel.send(
                success(`song of the day added to playlist <https://open.spotify.com/playlist/${process.env.SPOTIFY_PLAYLIST_ID}>`),
            )
        } catch (e) {
            console.error(e)

            return message.channel.send(error('an unknown error has occurred'))
        }
    }

    protected async history(message: Message): Promise<Discord.Message> {
        const text = await this.getSongHistoryText()

        if ( ! text) {
            return message.channel.send('the song of the day data is empty, try adding a new song')
        }

        const historyMessage = await message.channel.send(text)
        await historyMessage.react('⏮️')
        await historyMessage.react('⏭️')

        return historyMessage
    }

    public async onMessageReactionAdd(
        reaction: MessageReaction,
        user: Discord.User | PartialUser,
        next: NextFunction,
    ) {
        const message = reaction.message
        let pageStr: string | undefined

        if ( ! this._clientUserId ||
            this._clientUserId !== message.author.id ||
            ! ['⏮️', '⏭️'].includes(reaction.emoji.name) ||
            ! (pageStr = message.content.match(/page (\d+)/)?.[1])
        ) {
            return next()
        }

        let page = parseInt(pageStr, 10)

        if (reaction.emoji.name === '⏮️') {
            // ignore if trying to seek before first page
            if (page === 1) {
                return
            }
            page--
        } else {
            page++
        }

        const content = await this.getSongHistoryText(page)

        if ( ! content) {
            return
        }

        return message.edit({ content })
    }

    public async onMessageReactionRemove(
        reaction: MessageReaction,
        user: Discord.User | PartialUser,
        next: NextFunction,
    ) {
        return this.onMessageReactionAdd(reaction, user, next)
    }

    protected async random(message: Message): Promise<Discord.Message> {
        const song = await Song.createQueryBuilder('songs')
            .innerJoinAndSelect('songs.user', 'user')
            .orderBy('random()').limit(1).getOne()

        if ( ! song) {
            return message.channel.send('the song of the day data is empty, try adding a new song')
        }

        const url = `https://open.spotify.com/track/${song.trackId}`

        return message.channel.send(`:musical_note: **${song.artist} - ${song.title}** added by ${song.user.name} on ${song.date}\n${url}`)
    }

    protected async stats(message: Message): Promise<Discord.Message> {
        const rows = await Song.createQueryBuilder('songs')
            .innerJoin('songs.user', 'users')
            .groupBy('songs.user_id')
            .select('users.name as name')
            .addSelect('min(songs.date) as first_added')
            .addSelect('max(songs.date) as last_added')
            .addSelect('count(songs.id) as count')
            .addOrderBy('count', 'DESC')
            .addOrderBy('last_added', 'DESC')
            .addOrderBy('first_added', 'DESC')
            .addOrderBy('name')
            .getRawMany() as
        {
            name: string
            first_added: string
            last_added: string
            count: number
        }[]

        const markdown = toMarkdownTable(rows)

        if (typeof markdown === 'undefined') {
            return message.channel.send('the song of the day data is empty, try adding a new song')
        }

        return message.channel.send('```\n' + markdown + '\n```')
    }

    protected async getOrCreateUser(discordUser: Discord.User): Promise<User> {
        let user = await User.getRepository().findOne({ where: { id: discordUser.id } })
        if ( ! user) {
            user = new User()
            user.id = discordUser.id
            user.name = discordUser.username
            await user.save()
        }
        return user
    }

    protected async isTrackIdUnique(trackId: string): Promise<boolean> {
        const count = await Song.createQueryBuilder().where({ trackId }).getCount()

        return count === 0
    }

    protected async addSongOfTheDay(trackId: string, user: User): Promise<Song> {
        const spotify = await this.spotify()
        const { body: track } = await spotify.getTrack(trackId)

        const song = new Song()
        song.trackId = trackId
        song.artist = track.artists[0].name
        song.title = track.name
        song.date = new Date().toISOString().split('T')[0]
        song.userId = user.id
        song.user = user

        return await song.save()
    }

    protected async getSongHistoryText(page = 1): Promise<string | undefined> {
        const offset = (page - 1) * historyLimit

        const rows = await Song.createQueryBuilder('songs')
            .innerJoin('songs.user', 'users')
            .select(['artist', 'title', 'users.name as author', 'date', 'track_id'])
            .orderBy('songs.id', 'DESC')
            .offset(offset).limit(historyLimit)
            .getRawMany() as
            {
                artist: string
                title: string
                author: string
                date: string
                track_id: string
            }[]

        if (rows.length === 0) {
            return
        }

        return `:notepad_spiral: **Song of the Day History** — page ${page}\n\n` + rows.reduce(
            (res, row) => {
                const title = `**${row.artist} - ${row.title}** — added by ${row.author} on ${row.date}`
                const url = `<https://open.spotify.com/track/${row.track_id}>`
                res.push(`> ${title}\n> ${url}`)

                return res
            }, [] as string[]).join('\n> \n')
    }
}
