import type { Message } from 'discord.js'
import { injectable } from 'tsyringe'
import { command } from '../../../utils/command'
import { SongOfTheDayRepository } from '../repositories/SongOfTheDayRepository'

@injectable()
export default class SongOfTheDayRandomCommand {
    public constructor(
        private readonly repository: SongOfTheDayRepository,
    ) {
    }

    @command('sotd random', {
        description: 'Fetch a random historic song of the day.',
    })
    public async random(message: Message<true>): Promise<Message> {
        const song = await this.repository.getRandomServerSong(message.guildId)

        if ( ! song) {
            return message.channel.send('the song of the day data is empty, try adding a new song')
        }

        const url = `https://open.spotify.com/track/${song.trackId}`

        return message.channel.send(`:musical_note:  **${song.artist} - ${song.title}** added by ${song.user.name} on ${song.date}\n${url}`)
    }
}
