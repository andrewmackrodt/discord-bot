import { Column, BaseEntity, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './User'

@Entity({ name: 'songs' })
export class Song extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number

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
    public user!: User
}
