import { Message } from 'discord.js'
import type SpotifyWebApi from 'spotify-web-api-node'
import { injectable } from 'tsyringe'
import type { User } from '../../../models/User'
import { command, CommandUsageError } from '../../../utils/command'
import { error, success } from '../../../utils/plugin'
import type { Song } from '../models/Song'
import { SongOfTheDayRepository } from '../repositories/SongOfTheDayRepository'
import { SpotifyService } from '../services/SpotifyService'

@injectable()
export default class SongOfTheDayAddCommand {
    public constructor(
        private readonly repository: SongOfTheDayRepository,
        private readonly spotifyService: SpotifyService,
    ) {
    }

    @command('sotd add', {
        description: 'add a new song of the day',
        args: {
            trackId: { required: true, example: 'https://open.spotify.com/track/70cI6K8qorn5eOICHkUo95' },
        },
    })
    public async add(message: Message, args: string[]): Promise<Message> {
        const trackId = this.spotifyService.extractTrackId(args[0])

        if ( ! trackId) {
            throw new CommandUsageError('sotd add', 'trackId is malformed')
        }

        const guildId = message.guild!.id

        if ( ! await this.repository.isUniqueServerTrackId(guildId, trackId)) {
            return message.channel.send(error('song of the day must be unique'))
        }

        const spotify = await this.spotifyService.getSdk(guildId)

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
            const song = await this.addSongOfTheDay(sdk, guildId, trackId, user)

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

    protected async addSongOfTheDay(spotify: SpotifyWebApi, serverId: string, trackId: string, user: User): Promise<Song> {
        const { body: track } = await spotify.getTrack(trackId)

        return await this.repository.addSongOfTheDay(serverId, user, track)
    }
}
