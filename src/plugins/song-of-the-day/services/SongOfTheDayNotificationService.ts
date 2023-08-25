import type Discord from 'discord.js'
import { ChannelType } from 'discord.js'
import { getYmd } from '../../../utils/date'
import { component } from '../../../utils/di'
import { NotificationEventType } from '../models/SongOfTheDaySettings'
import { SongOfTheDayRepository } from '../repositories/SongOfTheDayRepository'

@component()
export class SongOfTheDayNotificationService {
    public static readonly NOTIFICATION_PICK_HOUR = 10
    public static readonly NOTIFICATION_OPEN_HOUR = 16
    public static readonly NOTIFICATION_STOP_HOUR = 18

    public constructor(
        private readonly repository: SongOfTheDayRepository,
    ) {
    }

    public async sendNotifications(guild: Discord.Guild, now = new Date()): Promise<void> {
        const settings = await this.repository.getServerSettings(guild.id)

        if ( ! settings?.notificationsChannelId) {
            return
        }

        const ymd = getYmd(now)
        const isSongOfTheDay = await this.repository.serverContainsSongOfTheDayOnDate(guild.id, ymd)

        if (isSongOfTheDay) {
            return
        }

        const channel = guild.channels.cache.get(settings.notificationsChannelId)

        if (channel?.type !== ChannelType.GuildText) {
            console.error(`songOfTheDay: server ${guild.id} has bad notifications channel configuration`)
            return
        }

        const isEventTypeProcessable = (eventType: NotificationEventType): boolean => {
            return settings.notificationsLastEventType !== eventType ||
                (
                    ! settings.notificationsLastEventTime ||
                    getYmd(settings.notificationsLastEventTime) !== ymd
                )
        }

        const nowHour = now.getHours()

        // pick a random user who has previously contributed to song of the day
        // on this server and send them a notification that it is their turn
        if (SongOfTheDayNotificationService.NOTIFICATION_PICK_HOUR <= nowHour && nowHour < SongOfTheDayNotificationService.NOTIFICATION_OPEN_HOUR) {
            if (isEventTypeProcessable(NotificationEventType.PICK)) {
                const user = await this.repository.getRandomServerUserWithPastSongOfTheDay(guild.id)

                if ( ! user) {
                    return
                }

                await channel.send(`**<@${user.id}> you have been chosen to select the song of the day** :musical_note:`)
                await this.repository.addNomination(guild.id, user.id, now)
                await this.repository.updateSettingsNotificationEvent(
                    settings,
                    NotificationEventType.PICK,
                    now,
                )
            }
        }
        // send a message to the channel that there has been no song of the day
        // and it is open to anyone on the server to add one
        else if (SongOfTheDayNotificationService.NOTIFICATION_OPEN_HOUR <= nowHour && nowHour < SongOfTheDayNotificationService.NOTIFICATION_STOP_HOUR) {
            if (isEventTypeProcessable(NotificationEventType.OPEN)) {
                await channel.send('**Song of the day is open to the floor** :musical_note:')

                await this.repository.updateSettingsNotificationEvent(
                    settings,
                    NotificationEventType.OPEN,
                    now,
                )
            }
        }
    }
}
