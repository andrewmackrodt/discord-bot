import type { SelectQueryBuilder } from 'typeorm'
import { OneToMany } from 'typeorm'

import { Song } from './models/Song'
import { SongOfTheDayNomination } from './models/SongOfTheDayNomination'
import { dataSource } from '../../db'
import { User } from '../../models/User'

declare module '../../models/User' {
    interface User {
        nominations?: SongOfTheDayNomination[]
        songs?: Song[]
        newNominationsQuery(alias?: string): SelectQueryBuilder<SongOfTheDayNomination>
        newSongsQuery(alias?: string): SelectQueryBuilder<Song>
    }
}

OneToMany(
    () => SongOfTheDayNomination,
    (nomination) => nomination.user,
)(User.prototype, 'nominations')

User.prototype.newNominationsQuery = function (alias?: string) {
    return dataSource
        .getRepository(SongOfTheDayNomination)
        .createQueryBuilder(alias)
        .andWhere('user_id = :id', { id: this.id })
}

OneToMany(
    () => Song,
    (song) => song.user,
)(User.prototype, 'songs')

User.prototype.newSongsQuery = function (alias?: string) {
    return dataSource
        .getRepository(Song)
        .createQueryBuilder(alias)
        .andWhere('user_id = :id', { id: this.id })
}
