import type { Relation } from 'typeorm'
import { Column, BaseEntity, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from '../../../models/User'

@Entity({ name: 'songs' })
@Index('songs_server_id_track_id_uindex', ['serverId', 'trackId'], { unique: true })
@Index('songs_user_id_index', ['userId'])
export class Song extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number

    @Column({ name: 'server_id' })
    public serverId!: string

    @Column({ name: 'track_id' })
    public trackId!: string

    @Column()
    public artist!: string

    @Column()
    public title!: string

    @Column()
    public date!: string

    @Column({ name: 'user_id' })
    public userId!: string

    @ManyToOne(() => User, user => user.songs)
    @JoinColumn({ name: 'user_id' })
    public user?: Relation<User>
}
