import { AttachmentBuilder, Message, TextChannel } from 'discord.js'
import { injectable } from 'tsyringe'
import { command } from '../../../utils/command'
import { getYmd } from '../../../utils/date'
import { Song } from '../models/Song'

const BATCH_LIMIT = 100

@injectable()
export default class SongOfTheDayExportCommand {
    @command('sotd export', {
        description: 'Export song of the day data as CSV.',
    })
    public async sendExportCSV(message: Message): Promise<Message> {
        const output: string[] = []
        output.push('"' + [
            'id',
            'title',
            'artist',
            'user_id',
            'user_name',
            'date',
            'url',
            'track_id',
            'album_id',
            'release_date',
            'playcount',
            'playcount_date',
            'message_id',
        ].join('","') + '"')

        let query = Song.createQueryBuilder()
            .where({ serverId: message.guildId })
            .orderBy('id', 'DESC')
            .limit(BATCH_LIMIT)

        const members = message.channel instanceof TextChannel
            ? message.channel.members
            : null

        for (let offset = 0; true; offset += BATCH_LIMIT) {
            query = query.offset(offset)
            const songs = await query.getMany()
            if (songs.length === 0) {
                break
            }
            for (const song of songs) {
                output.push([
                    song.id,
                    song.title,
                    song.artist,
                    song.userId,
                    members?.get(song.userId)?.displayName,
                    song.date,
                    `https://open.spotify.com/track/${song.trackId}`,
                    song.trackId,
                    song.albumId,
                    song.releaseDate,
                    song.playcount,
                    song.playcountUpdatedAt,
                    song.messageId,
                ]
                    .map(v => {
                        if (typeof v === 'object') return '"' + v.toISOString() + '"'
                        if (typeof v === 'number') return v
                        if (typeof v !== 'string') return ''
                        return `"${v.replaceAll('"', '""')}"`
                    })
                    .join(','))
            }
        }

        const todayYmd = getYmd()
        const buffer = Buffer.from(output.join('\n'))
        const name = `sotd-export-${todayYmd}.csv`
        const attachment = new AttachmentBuilder(buffer, { name })

        return message.channel.send({
            content: ':musical_note:  **song of the day export**',
            files: [attachment],
        })
    }
}
