import Discord, { Message } from 'discord.js'
import { NextFunction, Plugin } from '../../types/plugins'
import { Song } from '../models/Song'
import SpotifyWebApi from 'spotify-web-api-node'
import { User } from '../models/User'

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
    stats: {
        title: 'display sotd stats',
        usage: '#sotd stats',
    },
}

const helpText = ':notepad_spiral: **Song of the Day Help**\n\n' +
    Object.values(commandsHelp)
        .map(obj => `> **${obj.title}**:\n> \`${obj.usage}\``)
        .join('\n> \n')

function error(text: string): string {
    return `:no_entry: ${text}`
}

function success(text: string): string {
    return `:white_check_mark: ${text}`
}

function padLeft(text: string, maxLen: number): string {
    const padLen = maxLen - text.length
    const pad = new Array(padLen).fill(' ').join('')
    return `${pad}${text}`
}

function padRight(text: string, maxLen: number): string {
    const padLen = maxLen - text.length
    const pad = new Array(padLen).fill(' ').join('')
    return `${text}${pad}`
}

function toMarkdownRow(cols: string[]) {
    return '| ' + cols.join(' | ') + ' |'
}

export default class SpotifyPlugin implements Plugin {
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

        if (rows.length === 0) {
            return message.channel.send('the song of the day data is empty, try adding a new song')
        }

        const headers = Object.keys(rows[0])
        const maxLen = headers.map(header => header.length)

        for (const row of rows) {
            const values = Object.values(row)
            for (let i = 0; i < values.length; i++) {
                const str = typeof values[i] === 'number'
                    ? values[i].toString(10)
                    : values[i].toString()
                maxLen[i] = Math.max(maxLen[i], str.length)
            }
        }

        const table = rows.map(row => {
            const values = Object.values(row)
            const cols: string[] = []
            for (let i = 0; i < values.length; i++) {
                const value = values[i]
                if (typeof value === 'number') {
                    cols.push(padLeft(value.toString(10), maxLen[i]))
                } else {
                    cols.push(padRight(value.toString(), maxLen[i]))
                }
            }
            return toMarkdownRow(cols)
        })

        table.unshift(toMarkdownRow(headers.map((header, i) => new Array(maxLen[i]).fill('-').join(''))))
        table.unshift(toMarkdownRow(headers.map((header, i) => padRight(header, maxLen[i]))))

        return message.channel.send('```\n' + table.join('\n') + '\n```')
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
}
