import type { Relation } from 'typeorm'
import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
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

    @Column({ type: 'date' })
    public date!: string

    @Column({ name: 'user_id' })
    public userId!: string

    @Column({ name: 'message_id', nullable: true })
    public messageId?: string

    @Column({ nullable: true })
    public playcount?: number

    @Column({ name: 'playcount_updated_at', nullable: true, type: 'datetime' })
    public playcountUpdatedAt?: Date

    @CreateDateColumn({ name: 'created_at' })
    public createdAt!: Date

    @UpdateDateColumn({ name: 'updated_at' })
    public updatedAt!: Date

    @Column({ name: 'album_id', nullable: true })
    public albumId?: string

    @Column({ name: 'release_date', type: 'date', nullable: true })
    public releaseDate?: string

    @ManyToOne(() => User, user => user.songs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'songs_user_id_users_id_fkey' })
    public user?: Relation<User>
}
