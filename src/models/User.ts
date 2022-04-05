import { Column, BaseEntity, Entity, OneToMany, PrimaryColumn, getConnection } from 'typeorm'
import { Song } from '../plugins/song-of-the-day/models/Song'
import { SongOfTheDayNomination } from '../plugins/song-of-the-day/models/SongOfTheDayNomination'

@Entity({ name: 'users' })
export class User extends BaseEntity {
    @PrimaryColumn()
    public id!: string

    @Column()
    public name!: string

    @OneToMany(() => SongOfTheDayNomination, nomination => nomination.user)
    public nominations!: SongOfTheDayNomination[]

    @OneToMany(() => Song, song => song.user)
    public songs!: Song[]

    public newNominationsQuery() {
        return getConnection()
            .getRepository(SongOfTheDayNomination)
            .createQueryBuilder()
            .andWhere('user_id = :id', { id: this.id })
    }

    public newSongsQuery() {
        return getConnection()
            .getRepository(Song)
            .createQueryBuilder()
            .andWhere('user_id = :id', { id: this.id })
    }
}
