import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from 'typeorm'
import { User } from '../../../models/User'

@Entity({ name: 'faqs' })
@Index('faqs_server_id_name_uindex', ['serverId', 'name'], { unique: true })
@Index('faqs_author_id_index', ['authorId'])
export class Faq extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number

    @Column({ name: 'server_id' })
    public serverId!: string

    @Column()
    public name!: string

    @Column({ type: 'text' })
    public content!: string

    @Column({ name: 'author_id' })
    public authorId!: string

    @CreateDateColumn({ name: 'created_at' })
    public createdAt!: Date

    @UpdateDateColumn({ name: 'updated_at' })
    public updatedAt!: Date

    @ManyToOne(() => User, user => user.faqs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'author_id', foreignKeyConstraintName: 'faqs_author_id_users_id_fkey' })
    public author?: Relation<User>
}
