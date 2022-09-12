import { CommandUsage, error, getCommandUsage, sendPluginHelpMessage, sendCommandHelpMessage, success } from '../../utils/plugin'
import Discord, { Message, MessageEditOptions, MessageEmbed, MessageReaction, PartialUser, TextChannel } from 'discord.js'
import { NextFunction, Plugin } from '../../../types/plugins'
import { Schedule } from '../../Schedule'
import { Song } from './models/Song'
import { SongOfTheDayRepository } from './repositories/SongOfTheDayRepository'
import { NotificationEventType, SongOfTheDaySettings } from './models/SongOfTheDaySettings'
import SpotifyWebApi from 'spotify-web-api-node'
import { User } from '../../models/User'
import { isWorkingDay, ymd } from '../../utils/date'
import { random } from '../../utils/array'
import { toMarkdownTable } from '../../utils/string'

const trackIdRegExp = new RegExp(/\bspotify.com\/track\/([A-Za-z0-9_-]{10,})\b|^([A-Za-z0-9_-]{10,})$/)

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
        command: ['nominations'],
        title: 'show song of the day nomination history',
        usage: '#sotd nominations [username?]',
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
    public static readonly HISTORY_LIMIT = 5
    public static readonly NOTIFICATION_PICK_HOUR = 10
    public static readonly NOTIFICATION_OPEN_HOUR = 16
    public static readonly NOTIFICATION_STOP_HOUR = 18

    private readonly repository = new SongOfTheDayRepository()
    private clientUserId?: string
    private spotifyClients: Record<string, SpotifyClient> = {}

    public async onConnect(client: Discord.Client): Promise<void> {
        this.clientUserId = client.user?.id
    }

    public registerScheduler(client: Discord.Client, schedule: Schedule) {
        schedule.add('* * * * *', async () => {
            const now = new Date()

            // only run tasks on working days between 10am and 6pm
            if ( ! isWorkingDay(now) ||
                now.getHours() < SongOfTheDayPlugin.NOTIFICATION_PICK_HOUR ||
                now.getHours() > SongOfTheDayPlugin.NOTIFICATION_STOP_HOUR
            ) {
                return
            }

            for (const guild of client.guilds.cache.values()) {
                try {
                    await this.minutely(guild, now)
                } catch (e) {
                    console.error(e)
                }
            }
        })
    }

    protected async spotify(serverId: string): Promise<SpotifyClient | null> {
        let client = this.spotifyClients[serverId]
        let isNewConnection = false

        if (typeof client === 'undefined') {
            const settings = await this.repository.getServerSettings(serverId)

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
            case 'nominations':
                return this.nominations(message, params)
            case 'random':
                return this.random(message)
            case 'stats':
                return this.stats(message)
            default:
                return this.help(message, [command])
        }
    }

    protected async help(message: Message, params: string[] = []): Promise<Message> {
        return sendPluginHelpMessage(':notepad_spiral: **Song of the Day Help**', commandsUsage, message, params)
    }

    protected async add(message: Message, params: string[]): Promise<Message> {
        const url = params[0] ?? ''
        const trackIdMatch = trackIdRegExp.exec(url)

        if ( ! url || ! (trackIdMatch )) {
            return sendCommandHelpMessage(message, getCommandUsage(commandsUsage, 'add'), true)
        }

        const serverId = message.guild!.id
        const trackId = trackIdMatch[1] ?? trackIdMatch[2]

        if ( ! await this.repository.isUniqueServerTrackId(serverId, trackId)) {
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
            const user = await this.repository.getOrCreateUser(message.author)
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

    protected async history(message: Message, params: string[] = []): Promise<Message> {
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

    protected async nominations(message: Message, params: string[] = []): Promise<Message> {
        const options: SongHistoryOptions = { page: 1 }

        if (params.length > 0) {
            options.userId = await this.lookupUserId(message.channel as TextChannel, params[0])

            if ( ! options.userId) {
                return message.channel.send(error(`unknown user: ${params[0]}`))
            }
        }

        const embed = await this.getNominationsHistoryEmbed(message.guild!.id, options)

        if ( ! embed) {
            return message.channel.send('nominations history is empty')
        }

        const reply = await message.channel.send(embed)
        await reply.react('⏮')
        await reply.react('⏭')

        return reply
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

        let isHistoryReaction = false
        let isNominationsReaction = false

        if ( ! this.clientUserId ||
            this.clientUserId !== message.author.id ||
            ! ['⏮', '⏭'].includes(reaction.emoji.name) ||
            ! (
                (isHistoryReaction = Boolean(title?.match(/Song of the Day History/i))) ||
                (isNominationsReaction = Boolean(title?.match(/Song of the Day Nominations History/i)))
            ) ||
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
        let reply: MessageEditOptions | undefined

        if (isHistoryReaction) {
            reply = await this.getSongHistoryEmbed(message.guild!.id, options)
        }
        else if (isNominationsReaction) {
            reply = await this.getNominationsHistoryEmbed(message.guild!.id, options)
        }

        if ( ! reply) {
            return
        }

        return message.edit(reply)
    }

    public async onMessageReactionRemove(
        reaction: MessageReaction,
        user: Discord.User | PartialUser,
        next: NextFunction,
    ) {
        return this.onMessageReactionAdd(reaction, user, next)
    }

    protected async random(message: Message): Promise<Message> {
        const song = await this.repository.getRandomServerSong(message.guild!.id)

        if ( ! song) {
            return message.channel.send('the song of the day data is empty, try adding a new song')
        }

        const url = `https://open.spotify.com/track/${song.trackId}`

        return message.channel.send(`:musical_note: **${song.artist} - ${song.title}** added by ${song.user.name} on ${song.date}\n${url}`)
    }

    protected async stats(message: Message): Promise<Message> {
        const rows = await this.repository.getServerStats(message.guild!.id) as Record<string, any>[]

        const markdown = toMarkdownTable(rows)

        if (typeof markdown === 'undefined') {
            return message.channel.send('the song of the day data is empty, try adding a new song')
        }

        return message.channel.send('```\n' + markdown + '\n```')
    }

    protected async minutely(guild: Discord.Guild, now = new Date()): Promise<void> {
        const settings = await this.repository.getServerSettings(guild.id)

        if ( ! settings?.notificationsChannelId) {
            return
        }

        const nowYmd = ymd(now)
        const isSongOfTheDay = await this.repository.serverContainsSongOfTheDayOnDate(guild.id, nowYmd)

        if (isSongOfTheDay) {
            return
        }

        const _channel = guild.channels.cache.get(settings.notificationsChannelId)

        if ( ! _channel || _channel.type !== 'text') {
            console.error(`songOfTheDay: server ${guild.id} has bad notifications channel configuration`)
        }

        const channel = _channel as TextChannel

        const isEventTypeProcessable = (eventType: NotificationEventType): boolean => {
            return settings.notificationsLastEventType !== eventType ||
                (
                    ! settings.notificationsLastEventTime ||
                    ymd(settings.notificationsLastEventTime) !== nowYmd
                )
        }

        const nowHour = now.getHours()

        // pick a random user who has previously contributed to song of the day
        // on this server and sent them a notification that it is their turn
        if (SongOfTheDayPlugin.NOTIFICATION_PICK_HOUR <= nowHour && nowHour < SongOfTheDayPlugin.NOTIFICATION_OPEN_HOUR) {
            if (isEventTypeProcessable(NotificationEventType.PICK)) {
                const user = await this.repository.getRandomServerUserWithPastSongOfTheDay(guild.id)

                if ( ! user) {
                    return
                }

                await channel.send(`**<@${user.id}> you have been chosen to select the song of the day** :musical_note:`)
                await this.repository.addNomination(guild.id, user.id, now)
                await this.repository.updateSettingsNotificationEvent(
                    settings,
                    NotificationEventType.PICK,
                    now,
                )
            }
        }
        // send a message to the channel that there has been no song of the day
        // and it is open to anyone on the server to add one
        else if (SongOfTheDayPlugin.NOTIFICATION_OPEN_HOUR <= nowHour && nowHour < SongOfTheDayPlugin.NOTIFICATION_STOP_HOUR) {
            if (isEventTypeProcessable(NotificationEventType.OPEN)) {
                await channel.send('**Song of the day is open to the floor** :musical_note:')

                await this.repository.updateSettingsNotificationEvent(
                    settings,
                    NotificationEventType.OPEN,
                    now,
                )
            }
        }
    }

    protected async addSongOfTheDay(spotify: SpotifyWebApi, serverId: string, trackId: string, user: User): Promise<Song> {
        const { body: track } = await spotify.getTrack(trackId)

        return await this.repository.addSongOfTheDay(serverId, user, track)
    }

    protected async getSongHistoryEmbed(serverId: string, options?: SongHistoryOptions) {
        const page = options?.page ?? 1
        const offset = (page - 1) * SongOfTheDayPlugin.HISTORY_LIMIT

        const rows = await this.repository.getServerHistory({
            serverId,
            userId: options?.userId,
            limit: SongOfTheDayPlugin.HISTORY_LIMIT,
            offset,
        })

        if (rows.length === 0) {
            return
        }

        const firstSongIndex = 1 + ((page - 1) * SongOfTheDayPlugin.HISTORY_LIMIT)

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

    protected async getNominationsHistoryEmbed(serverId: string, options?: SongHistoryOptions) {
        const page = options?.page ?? 1
        const offset = (page - 1) * SongOfTheDayPlugin.HISTORY_LIMIT

        const rows = await this.repository.getServerNominationHistory({
            serverId,
            userId: options?.userId,
            limit: SongOfTheDayPlugin.HISTORY_LIMIT,
            offset,
        })

        if (rows.length === 0) {
            return
        }

        const index = 1 + ((page - 1) * SongOfTheDayPlugin.HISTORY_LIMIT)

        return {
            embed: {
                title: ':notepad_spiral: **Song of the Day Nominations History**',
                description: JSON.stringify(options).replace(/["{}]/g, '').replace(/:/g, ': ').replace(/,/g, ' | '),
                fields: rows.map((row, i) => ([
                    {
                        name: '#',
                        value: index + i,
                        inline: true,
                    },
                    {
                        name: 'date',
                        value: row.date,
                        inline: true,
                    },
                    {
                        name: 'username',
                        value: row.username,
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

        const user = await this.repository.getUserByName(nameOrMention)

        if (user) {
            return user.id
        }
    }
}