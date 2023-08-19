import type { Relation } from 'typeorm'
import { Column, BaseEntity, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '../../../models/User'

@Entity({ name: 'sotd_nominations' })
export class SongOfTheDayNomination extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number

    @Column({ name: 'server_id' })
    public serverId!: string

    @Column({ name: 'user_id' })
    public userId!: string

    @Column()
    public date!: string

    @ManyToOne(() => User, user => user.nominations)
    @JoinColumn({ name: 'user_id' })
    public user?: Relation<User>
}
