import type { Message } from 'discord.js'
import { injectable } from 'tsyringe'

import { command, CommandUsageError } from '../../../utils/command'
import { error } from '../../../utils/plugin'
import { extractTrackId } from '../helpers'
import { SpotifyService } from '../services/SpotifyService'
import { SpotifyWebPlayerApi } from '../services/SpotifyWebPlayerApi'

@injectable()
export default class SongOfTheDayInfoCommand {
    constructor(
        private readonly spotifyService: SpotifyService,
        private readonly webPlayerApi: SpotifyWebPlayerApi,
    ) {}

    @command('sotd info', {
        description: 'Query Spotify API for song info.',
        args: {
            trackId: {
                required: true,
                example: 'https://open.spotify.com/track/70cI6K8qorn5eOICHkUo95',
            },
        },
    })
    async info(message: Message<true>, url: string): Promise<Message> {
        const trackId = extractTrackId(url)

        if (!trackId) {
            throw new CommandUsageError('sotd add', 'trackId is malformed')
        }

        const spotify = await this.spotifyService.getSdk(message.guildId)

        if (!spotify) {
            return message.channel.send(
                error(
                    'the spotify plugin is not correctly configured, please contact the server admin',
                ),
            )
        }

        const { sdk } = spotify

        try {
            const { body: track } = await sdk.getTrack(trackId)
            const album = await this.webPlayerApi.getAlbum(track.album.id)
            const playCount = album.tracks.items.find((t) => t.track.uri.endsWith(`:${trackId}`))
                ?.track.playcount
            if (!playCount) {
                return message.channel.send(error('an unknown error has occurred'))
            }
            const artist = track.artists[0].name
            const playCountFmt = parseInt(playCount).toLocaleString()
            return message.reply(
                `:musical_note:  **${artist} - ${track.name}** has ${playCountFmt} plays`,
            )
        } catch (e) {
            console.error(e)

            return message.channel.send(error('an unknown error has occurred'))
        }
    }
}
