import { NextFunction, Plugin } from '../../types/plugins'
import SpotifyWebApi from 'spotify-web-api-node'
import Discord, { Message } from 'discord.js'

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
        const [action] = words

        if (action !== '#sotd') {
            return next()
        }

        if ( ! this.isSupported) {
            return msg.reply('the spotify plugin is not correctly configured, please contact the server admin')
        }

        return msg.reply('song of the day coming soon™')
    }
}
