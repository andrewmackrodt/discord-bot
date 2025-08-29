import type { Relation } from 'typeorm'
import {
    BaseEntity,
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm'

import { User } from '../../../models/User'

@Entity({ name: 'sotd_nominations' })
@Index('sotd_nominations_server_id_index', ['serverId'])
export class SongOfTheDayNomination extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: 'server_id' })
    serverId!: string

    @Column({ name: 'user_id' })
    userId!: string

    @Column()
    date!: string

    @ManyToOne(() => User, (user) => user.nominations, { onDelete: 'CASCADE' })
    @JoinColumn({
        name: 'user_id',
        foreignKeyConstraintName: 'sotd_nominations_user_id_users_id_fkey',
    })
    user?: Relation<User>
}
