import { Song } from '../models/Song'
import { SongOfTheDaySettings } from '../models/SongOfTheDaySettings'
import { User } from '../models/User'

interface ServerHistoryParams {
    serverId: string
    userId?: string
    limit: number
    offset: number
}

interface ServerHistoryRow {
    artist: string
    title: string
    author: string
    date: string
    track_id: string
}

interface ServerStatsRow {
    name: string
    first_added: string
    last_added: string
    count: number
}

export class SongOfTheDayRepository {
    public async addSongOfTheDay(
        serverId: string,
        user: User,
        track:  SpotifyApi.SingleTrackResponse,
    ): Promise<Song> {
        const song = new Song()
        song.serverId = serverId
        song.trackId = track.id
        song.artist = track.artists[0].name
        song.title = track.name
        song.date = new Date().toISOString().split('T')[0]
        song.userId = user.id
        song.user = user

        return await song.save()
    }

    public async getRandomServerSong(serverId: string): Promise<Song | undefined> {
        return await Song.createQueryBuilder('songs')
            .innerJoinAndSelect('songs.user', 'user')
            .where({ serverId })
            .orderBy('random()').limit(1).getOne()
    }

    public async getServerHistory(params: ServerHistoryParams): Promise<ServerHistoryRow[]> {
        let query = Song.createQueryBuilder('songs')
            .innerJoin('songs.user', 'users')
            .select(['artist', 'title', 'users.name as author', 'date', 'track_id'])
            .where({ serverId: params.serverId })
            .orderBy('songs.id', 'DESC')
            .limit(params.limit).offset(params.offset)

        if (params.userId) {
            query = query.andWhere('songs.user_id = :userId', { userId: params.userId })
        }

        return await query.getRawMany() as ServerHistoryRow[]
    }

    public async getServerSettings(serverId: string): Promise<SongOfTheDaySettings | undefined> {
        return await SongOfTheDaySettings.findOne({ where: { serverId } })
    }

    public async getServerStats(serverId: string): Promise<ServerStatsRow[]> {
        return await Song.createQueryBuilder('songs')
            .innerJoin('songs.user', 'users')
            .groupBy('songs.user_id')
            .select('users.name as name')
            .addSelect('min(songs.date) as first_added')
            .addSelect('max(songs.date) as last_added')
            .addSelect('count(songs.id) as count')
            .where({ serverId })
            .addOrderBy('count', 'DESC')
            .addOrderBy('last_added', 'DESC')
            .addOrderBy('first_added', 'DESC')
            .addOrderBy('name')
            .getRawMany() as ServerStatsRow[]
    }

    public async isUniqueServerTrackId(serverId: string, trackId: string): Promise<boolean> {
        const count = await Song.createQueryBuilder().where({ serverId, trackId }).getCount()

        return count === 0
    }

    public async getOrCreateUser(params: { id: string; username: string }): Promise<User> {
        let user = await User.getRepository().findOne({ where: { id: params.id } })

        if ( ! user) {
            user = new User()
            user.id = params.id
            user.name = params.username
            await user.save()
        }

        return user
    }

    public async getUserByName(name: string): Promise<User | undefined> {
        return await User.findOne({ name: name })
    }
}
