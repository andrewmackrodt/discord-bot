import Discord, { Message } from 'discord.js'
import { NextFunction, Plugin } from '../../types/plugins'
import { Song } from '../models/Song'
import SpotifyWebApi from 'spotify-web-api-node'
import { User } from '../models/User'

const trackIdRegExp = new RegExp(/\bspotify.com\/track\/([A-Za-z0-9_-]{10,})\b|^([A-Za-z0-9_-]{10,})$/)

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

    public async onConnect(client: Discord.Client): Promise<any> {
        if ( ! this.isSupported) {
            return
        }

        const spotify = await this.spotify()
        const { body: user } = await spotify.getMe()

        console.info('spotify: authenticated as', user.id)
    }

    public async onMessage (msg: Message, next: NextFunction): Promise<any> {
        const words = msg.content.split(/[ \t]+/)
        const [action, command, url] = words

        if (action !== '#sotd') {
            return next()
        }

        if ( ! this.isSupported) {
            return msg.channel.send('the spotify plugin is not correctly configured, please contact the server admin')
        }

        let trackIdMatch: RegExpExecArray | null

        if (command !== 'add' ||
            ! url ||
            ! (trackIdMatch = trackIdRegExp.exec(url))
        ) {
            return msg.channel.send('usage: `#sotd add https://open.spotify.com/track/70cI6K8qorn5eOICHkUo95`')
        }

        const trackId = trackIdMatch[1] ?? trackIdMatch[2]

        if ( ! await this.isTrackIdUnique(trackId)) {
            return msg.channel.send('song of the day must be unique')
        }

        try {
            // create entry in database
            const user = await this.getOrCreateUser(msg.author)
            const song = await this.addSongOfTheDay(trackId, user)

            // create entry in playlist
            const spotify = await this.spotify()
            const { body: res } = await spotify.addTracksToPlaylist(process.env.SPOTIFY_PLAYLIST_ID!, [
                `spotify:track:${trackId}`,
            ])

            return msg.channel.send(`song of the day added to playlist <https://open.spotify.com/playlist/${process.env.SPOTIFY_PLAYLIST_ID}>`)
        } catch (e) {
            console.error(e)

            return msg.channel.send('error adding song of the day')
        }
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
