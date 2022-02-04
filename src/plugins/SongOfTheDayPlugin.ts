import Discord, { Message, MessageEmbed, MessageReaction, PartialUser, TextChannel } from 'discord.js'
import { NextFunction, Plugin } from '../../types/plugins'
import { Song } from '../models/Song'
import { SongOfTheDaySettings } from '../models/SongOfTheDaySettings'
import SpotifyWebApi from 'spotify-web-api-node'
import { User } from '../models/User'
import { padRight, toMarkdownTable } from '../utils/string'
import { random } from '../utils/array'

const trackIdRegExp = new RegExp(/\bspotify.com\/track\/([A-Za-z0-9_-]{10,})\b|^([A-Za-z0-9_-]{10,})$/)

interface CommandUsage {
    command: string[]
    title: string
    usage: string
    params?: Record<string, string>
}

const commandsUsage: CommandUsage[] = [
    {
        command: ['add'],
        title: 'add a new song of the day',
        usage: '#sotd add https://open.spotify.com/track/70cI6K8qorn5eOICHkUo95',
    },
    {
        command: ['history'],
        title: 'show song of the day history',
        usage: '#sotd history [username?]',
    },
    {
        command: ['random'],
        title: 'fetch a random previously entered song of the day',
        usage: '#sotd random',
    },
    {
        command: ['stats'],
        title: 'display song of the day stats',
        usage: '#sotd stats',
    },
]

function getCommandUsage(...params: string[]): CommandUsage {
    const paramsStr = params.join(' ')

    const usage = commandsUsage.find(help => (
        help.command.length === params.length && help.command.join(' ') === paramsStr
    ))

    if ( ! usage) {
        throw new Error(`unknown command: ${params.join(' ')}`)
    }

    return usage
}

function formatCommandUsage(usage: CommandUsage): string {
    const text: string[] = []
    text.push(`**${usage.title}**:`)
    text.push('```')
    text.push(usage.usage)

    if (usage.params) {
        const params: string[] = []
        for (const [param, description] of Object.entries(usage.params)) {
            params.push(' ' + padRight(param, 10) + description)
        }
        if (params.length > 0) {
            text.push('')
            text.push('params:')
            text.push(...params)
        }
    }

    text.push('```')

    return '> ' + text.join('\n> ')
}

const helpText = ':notepad_spiral: **Song of the Day Help**\n\n' +
    Object.values(commandsUsage).map(formatCommandUsage).join('\n')

const historyLimit = 5

function error(text: string): string {
    return `:no_entry: ${text}`
}

function success(text: string): string {
    return `:white_check_mark: ${text}`
}

interface SongHistoryOptions {
    page?: number
    userId?: string
}

interface SpotifyClient {
    settings: SongOfTheDaySettings
    sdk: SpotifyWebApi
    tokenExpiresAt: Date
}

/**
 * Developer Dashboard:
 * https://developer.spotify.com/dashboard/applications
 *
 * Authorization Code Flow:
 * https://accounts.spotify.com/en/authorize?response_type=code
 *   &client_id={{ SPOTIFY_CLIENT_ID }}
 *   &redirect_uri=http:%2F%2Flocalhost:8080
 *   &scope=playlist-read-collaborative%20playlist-modify-public%20playlist-modify-private
 */
export default class SongOfTheDayPlugin implements Plugin {
    private clientUserId?: string
    private spotifyClients: Record<string, SpotifyClient> = {}

    protected async spotify(serverId: string): Promise<SpotifyClient | null> {
        let client = this.spotifyClients[serverId]
        let isNewConnection = false

        if (typeof client === 'undefined') {
            const settings = await SongOfTheDaySettings.findOne({ where: { serverId } })

            if (settings) {
                this.spotifyClients[serverId] = client = {
                    settings,
                    sdk: new SpotifyWebApi({
                        clientId: settings.spotifyClientId,
                        clientSecret: settings.spotifyClientSecret,
                        redirectUri: 'http://localhost:8080',
                        refreshToken: settings.spotifyRefreshToken,
                    }),
                    tokenExpiresAt: new Date(1970, 0, 1, 0, 0, 0, 0),
                }

                isNewConnection = true
            }
        }

        if ( ! client) {
            return null
        }

        if (client.tokenExpiresAt <= new Date()) {
            const { body: tokenResponse } = await client.sdk.refreshAccessToken()
            client.sdk.setAccessToken(tokenResponse.access_token)
            client.tokenExpiresAt = new Date()
            client.tokenExpiresAt.setSeconds(client.tokenExpiresAt.getSeconds() + tokenResponse.expires_in - 30)

            if (isNewConnection) {
                const { body: user } = await client.sdk.getMe()

                console.info(`spotify: server ${serverId} authenticated as ${user.id}`)
            }
        }

        return client
    }

    public async onMessage(message: Message, next: NextFunction): Promise<unknown> {
        const words = message.content.split(/[ \t]+/)
        const [tag, command, ...params] = words

        if (tag !== '#sotd' || ! message.guild) {
            return next()
        }

        switch (command) {
            case 'help':
                return this.help(message, params)
            case 'add':
                return this.add(message, params)
            case 'history':
                return this.history(message, params)
            case 'random':
                return this.random(message)
            case 'stats':
                return this.stats(message)
            default:
                return this.help(message, [command])
        }
    }

    protected async sendCommandHelp(
        message: Message,
        usage: CommandUsage,
        isSyntaxError = false,
    ): Promise<Discord.Message> {
        let response = formatCommandUsage(usage)

        if (isSyntaxError) {
            response = error('the command contains a syntax error') + `\n\n${response}`
        }

        return message.channel.send(response)
    }

    protected async help(message: Message, params: string[] = []): Promise<Discord.Message> {
        let replyPrefix = ''

        if (params.length > 0) {
            const paramsStr = params.join(' ')

            for (const usage of commandsUsage) {
                if (params.length === usage.command.length && paramsStr === usage.command.join(' ')) {
                    return this.sendCommandHelp(message, usage)
                }
            }

            replyPrefix = error('unknown command') + '\n\n'
        }

        return message.channel.send(replyPrefix + helpText)
    }

    protected async add(message: Message, params: string[]): Promise<Discord.Message> {
        const url = params[0] ?? ''
        const trackIdMatch = trackIdRegExp.exec(url)

        if ( ! url || ! (trackIdMatch )) {
            return this.sendCommandHelp(message, getCommandUsage('add'), true)
        }

        const serverId = message.guild!.id
        const trackId = trackIdMatch[1] ?? trackIdMatch[2]

        if ( ! await this.isTrackIdUnique(serverId, trackId)) {
            return message.channel.send(error('song of the day must be unique'))
        }

        const spotify = await this.spotify(message.guild!.id)

        if ( ! spotify) {
            return message.channel.send(
                error('the spotify plugin is not correctly configured, please contact the server admin'),
            )
        }

        try {
            const sdk = spotify.sdk
            const playlistId = spotify.settings.spotifyPlaylistId

            // create entry in database
            const user = await this.getOrCreateUser(message.author)
            const song = await this.addSongOfTheDay(sdk, serverId, trackId, user)

            // create entry in playlist
            const { body: res } = await sdk.addTracksToPlaylist(playlistId, [
                `spotify:track:${trackId}`,
            ])

            return message.channel.send(
                success(`song of the day added to playlist <https://open.spotify.com/playlist/${playlistId}>`),
            )
        } catch (e) {
            console.error(e)

            return message.channel.send(error('an unknown error has occurred'))
        }
    }

    protected async history(message: Message, params: string[] = []): Promise<Discord.Message> {
        const options: SongHistoryOptions = { page: 1 }

        if (params.length > 0) {
            options.userId = await this.lookupUserId(message.channel as TextChannel, params[0])

            if ( ! options.userId) {
                return message.channel.send(error(`unknown user: ${params[0]}`))
            }
        }

        const songHistoryEmbed = await this.getSongHistoryEmbed(message.guild!.id, options)

        if ( ! songHistoryEmbed) {
            return message.channel.send('the song of the day data is empty, try adding a new song')
        }

        const historyMessage = await message.channel.send(songHistoryEmbed)
        await historyMessage.react('⏮')
        await historyMessage.react('⏭')

        return historyMessage
    }

    public async onMessageReactionAdd(
        reaction: MessageReaction,
        user: Discord.User | PartialUser,
        next: NextFunction,
    ) {
        const message = reaction.message
        const embed = reaction.message.embeds[0] as MessageEmbed | undefined
        const { title, description } = embed ?? {}
        const pageStr = /page(?: |: ?)([0-9]+)/.exec(description ?? '')?.[1] ?? ''
        let page = parseInt(pageStr, 10)
        const userId = /userId(?: |: ?)([0-9]+)/.exec(description ?? '')?.[1]

        if ( ! this.clientUserId ||
            this.clientUserId !== message.author.id ||
            ! ['⏮', '⏭'].includes(reaction.emoji.name) ||
            ! title?.match(/Song of the Day History/i) ||
            isNaN(page)
        ) {
            return next()
        }

        if (reaction.emoji.name === '⏮') {
            // ignore if trying to seek before first page
            if (page === 1) {
                return
            }
            page--
        } else {
            page++
        }

        const options: SongHistoryOptions = { page, userId }

        const songHistory = await this.getSongHistoryEmbed(message.guild!.id, options)

        if ( ! songHistory) {
            return
        }

        return message.edit(songHistory)
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
            .where({ serverId: message.guild!.id })
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
            .where({ serverId: message.guild!.id })
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

    protected async isTrackIdUnique(serverId: string, trackId: string): Promise<boolean> {
        const count = await Song.createQueryBuilder().where({ serverId, trackId }).getCount()

        return count === 0
    }

    protected async addSongOfTheDay(spotify: SpotifyWebApi, serverId: string, trackId: string, user: User): Promise<Song> {
        const { body: track } = await spotify.getTrack(trackId)

        const song = new Song()
        song.serverId = serverId
        song.trackId = trackId
        song.artist = track.artists[0].name
        song.title = track.name
        song.date = new Date().toISOString().split('T')[0]
        song.userId = user.id
        song.user = user

        return await song.save()
    }

    protected async getSongHistoryEmbed(serverId: string, options?: SongHistoryOptions) {
        const page = options?.page ?? 1
        const offset = (page - 1) * historyLimit

        let query = Song.createQueryBuilder('songs')
            .innerJoin('songs.user', 'users')
            .select(['artist', 'title', 'users.name as author', 'date', 'track_id'])
            .where({ serverId })
            .orderBy('songs.id', 'DESC')
            .offset(offset).limit(historyLimit)

        if (typeof options?.userId !== 'undefined') {
            query = query.andWhere('songs.user_id = :userId', { userId: options.userId })
        }

        const rows = await query.getRawMany() as
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

        const firstSongIndex = 1 + ((page - 1) * historyLimit)

        return {
            embed: {
                title: ':notepad_spiral: **Song of the Day History**',
                description: JSON.stringify(options).replace(/["{}]/g, '').replace(/:/g, ': ').replace(/,/g, ' | '),
                fields: rows.map((row, i) => ([
                    {
                        name: '#',
                        value: firstSongIndex + i,
                        inline: true,
                    },
                    {
                        name: `${row.artist} - ${row.title}`,
                        value: `https://open.spotify.com/track/${row.track_id}`,
                        inline: true,
                    },
                    {
                        name: `added by ${row.author}`,
                        value: `on ${row.date}`,
                        inline: true,
                    },
                ])).flat(),
            },
        }
    }

    protected async lookupUserId(channel: TextChannel, nameOrMention: string) : Promise<string | undefined> {
        const userIdMentionMatch = nameOrMention.match(/^<@!([0-9]+)>$/)

        if (userIdMentionMatch) {
            return userIdMentionMatch[1]
        }
        const member = channel.members.find(m => (
            m.user.username.localeCompare(nameOrMention, undefined, { sensitivity: 'base' }) === 0
        ))

        if (member) {
            return member.id
        }

        const user = await User.findOne({ name: nameOrMention })

        if (user) {
            return user.id
        }
    }
}
