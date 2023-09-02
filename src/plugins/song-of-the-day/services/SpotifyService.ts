import SpotifyWebApi from 'spotify-web-api-node'
import { component } from '../../../utils/di'
import type { SongOfTheDaySettings } from '../models/SongOfTheDaySettings'
import { SongOfTheDayRepository } from '../repositories/SongOfTheDayRepository'

interface SpotifyClient {
    settings: SongOfTheDaySettings
    sdk: SpotifyWebApi
    tokenExpiresAt: Date
}

@component()
export class SpotifyService {
    private readonly cache: Record<string, SpotifyClient> = {}

    public constructor(
        private readonly repository: SongOfTheDayRepository,
    ) {
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
    public async getSdk(guildId: string): Promise<SpotifyClient | null> {
        let client = this.cache[guildId]
        let isNewConnection = false

        if (typeof client === 'undefined') {
            const settings = await this.repository.getServerSettings(guildId)

            if (settings) {
                this.cache[guildId] = client = {
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

                console.info(`spotify: server ${guildId} authenticated as ${user.id}`)
            }
        }

        return client
    }
}
