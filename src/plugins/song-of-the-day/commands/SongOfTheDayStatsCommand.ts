import { Message } from 'discord.js'
import { injectable } from 'tsyringe'
import { command } from '../../../utils/command'
import { toMarkdownTable } from '../../../utils/string'
import { SongOfTheDayRepository } from '../repositories/SongOfTheDayRepository'

@injectable()
export default class SongOfTheDayStatsCommand {
    public constructor(
        private readonly repository: SongOfTheDayRepository,
    ) {
    }

    @command('sotd stats', {
        description: 'display song of the day stats',
    })
    public async stats(message: Message): Promise<Message> {
        const rows = await this.repository.getServerStats(message.guild!.id) as Record<string, any>[]

        const markdown = toMarkdownTable(rows)

        if (typeof markdown === 'undefined') {
            return message.channel.send('the song of the day data is empty, try adding a new song')
        }

        return message.channel.send('```\n' + markdown + '\n```')
    }
}
