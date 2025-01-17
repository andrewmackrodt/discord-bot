import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

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
}
