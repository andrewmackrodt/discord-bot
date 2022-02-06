import { Column, BaseEntity, Entity, OneToMany, PrimaryColumn, getConnection } from 'typeorm'
import { Song } from '../plugins/song-of-the-day/models/Song'

@Entity({ name: 'users' })
export class User extends BaseEntity {
    @PrimaryColumn()
    public id!: string

    @Column()
    public name!: string

    @OneToMany(() => Song, song => song.user)
    public songs!: Song[]

    public newSongsQuery() {
        return getConnection()
            .getRepository(Song)
            .createQueryBuilder()
            .andWhere('user_id = :id', { id: this.id })
    }
}
