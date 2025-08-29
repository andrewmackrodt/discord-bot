import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'

@Entity({ name: 'faqs' })
@Index('faqs_server_id_name_uindex', ['serverId', 'name'], { unique: true })
@Index('faqs_author_id_index', ['authorId'])
export class Faq extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: 'server_id' })
    serverId!: string

    @Column()
    name!: string

    @Column({ type: 'text' })
    content!: string

    @Column({ name: 'author_id' })
    authorId!: string

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date
}
