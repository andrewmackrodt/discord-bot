import { Song } from '../models/Song'
import { NotificationEventType, SongOfTheDaySettings } from '../models/SongOfTheDaySettings'
import { User } from '../models/User'
import { ymd } from '../utils/date'

interface ServerHistoryParams {
    serverId: string
    userId?: string
    limit: number
    offset?: number
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
        song.date = ymd()
        song.userId = user.id
        song.user = user

        return await song.save()
    }

    public async serverContainsSongOfTheDayOnDate(serverId: string, date: string): Promise<boolean> {
        const count = await Song.createQueryBuilder().where({ serverId, date }).getCount()

        return count > 1
    }

    public async getRandomServerSong(serverId: string): Promise<Song & { user: User } | undefined> {
        return await Song.createQueryBuilder('songs')
            .innerJoinAndSelect('songs.user', 'user')
            .where({ serverId })
            .orderBy('random()').limit(1).getOne() as Song & { user: User } | undefined
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

    public async getRandomServerUserWithPastSongOfTheDay(serverId: string): Promise<User | undefined> {
        return await User.createQueryBuilder('users')
            .innerJoin(qb => qb.from(Song, 'songs')
                    .select('user_id')
                    .where({ serverId })
                    .distinct(true),
                'server_users',
                'server_users.user_id = users.id')
            .orderBy('random()')
            .limit(1)
            .getOne()
    }

    public async updateSettingsNotificationEvent(
        settings: SongOfTheDaySettings,
        eventType: NotificationEventType,
        eventTime: Date,
    ): Promise<SongOfTheDaySettings> {
        settings.notificationsLastEventType = eventType
        settings.notificationsLastEventTime = eventTime.toISOString()

        return await settings.save()
    }
}
