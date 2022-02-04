import { Column, BaseEntity, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './User'

@Entity({ name: 'songs' })
export class Song extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number

    @Column({ name: 'server_id' })
    @Index({ unique: true })
    public serverId!: string

    @Column({ name: 'track_id' })
    @Index({ unique: true })
    public trackId!: string

    @Column()
    public artist!: string

    @Column()
    public title!: string

    @Column()
    public date!: string

    @Column({ name: 'user_id' })
    @Index()
    public userId!: string

    @ManyToOne(() => User, user => user.songs)
    @JoinColumn({ name: 'user_id' })
    public user!: User
}
