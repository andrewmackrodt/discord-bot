import { Column, BaseEntity, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'users' })
export class User extends BaseEntity {
    @PrimaryColumn()
    public id!: string

    @Column()
    public name!: string
}
