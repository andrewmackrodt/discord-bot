import { component } from '../../../utils/di'
import { Faq } from '../models/Faq'

@component()
export class FaqRepository {
    public async addFaq(serverId: string, name: string, content: string, authorId: string): Promise<Faq> {
        const faq = new Faq()
        faq.serverId = serverId
        faq.name = name
        faq.content = content
        faq.authorId = authorId
        return faq.save()
    }

    public async deleteFaq(serverId: string, name: string): Promise<boolean> {
        const { affected } = await Faq.delete({ serverId, name })

        return Boolean(affected)
    }

    public async getFaq(serverId: string, name: string): Promise<Faq | null> {
        return Faq.findOneBy({ serverId, name })
    }

    public async listFaq(serverId: string): Promise<string[]> {
        return Faq.createQueryBuilder()
            .select('name')
            .where({ serverId })
            .getRawMany()
            .then(rows => rows.map(row => row.name))
    }
}
