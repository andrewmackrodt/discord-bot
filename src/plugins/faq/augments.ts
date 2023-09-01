import type { SelectQueryBuilder } from 'typeorm'
import { OneToMany } from 'typeorm'
import { Faq } from './models/Faq'
import { dataSource } from '../../db'
import { User } from '../../models/User'

declare module '../../models/User' {
    interface User {
        faqs?: Faq[]
        newFaqsQuery(alias?: string):  SelectQueryBuilder<Faq>
    }
}

OneToMany(() => Faq, faq => faq.author)(User.prototype, 'faqs')

User.prototype.newFaqsQuery = function (alias?: string) {
    return dataSource.getRepository(Faq)
        .createQueryBuilder(alias)
        .andWhere('author_id = :id', { id: this.id })
}
