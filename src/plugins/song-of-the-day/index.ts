import type Discord from 'discord.js'
import { injectable } from 'tsyringe'
import SongOfTheDayAddCommand from './commands/SongOfTheDayAddCommand'
import SongOfTheDayHistoryCommand from './commands/SongOfTheDayHistoryCommand'
import SongOfTheDayNominationsCommand from './commands/SongOfTheDayNominationsCommand'
import SongOfTheDayRandomCommand from './commands/SongOfTheDayRandomCommand'
import SongOfTheDayStatsCommand from './commands/SongOfTheDayStatsCommand'
import { SongOfTheDayNotificationService } from './services/SongOfTheDayNotificationService'
import type { Plugin } from '../../../types/plugins'
import type { CommandRegistry } from '../../registries/CommandRegistry'
import type { InteractionRegistry } from '../../registries/InteractionRegistry'
import type { Schedule } from '../../Schedule'
import { registerCommandsFromDecorators } from '../../utils/command'
import { isWorkingDay } from '../../utils/date'
import { registerInteractionsFromDecorators } from '../../utils/interaction'

@injectable()
export default class SongOfTheDayPlugin implements Plugin {
    public constructor(
        private readonly notificationService: SongOfTheDayNotificationService,
        private readonly add: SongOfTheDayAddCommand,
        private readonly history: SongOfTheDayHistoryCommand,
        private readonly nominations: SongOfTheDayNominationsCommand,
        private readonly random: SongOfTheDayRandomCommand,
        private readonly stats: SongOfTheDayStatsCommand,
    ) {
    }

    protected get commands() {
        return [this.add, this.history, this.nominations, this.random, this.stats]
    }

    public doCommandRegistration(registry: CommandRegistry) {
        registry.add('sotd', builder => builder
            .setEmoji(':notepad_spiral:')
            .setTitle('Song of the Day')
            .setDescription('Song of the Day plugin.')
            .build())

        this.commands.forEach(instance => registerCommandsFromDecorators(registry, instance))
    }

    public doInteractionRegistration(registry: InteractionRegistry) {
        this.commands.forEach(instance => registerInteractionsFromDecorators(registry, instance))
    }

    public registerScheduler(client: Discord.Client, schedule: Schedule) {
        schedule.add('* * * * *', async () => {
            const now = new Date()

            // only run tasks on working days between 10am and 6pm
            if ( ! isWorkingDay(now) ||
                now.getHours() < SongOfTheDayNotificationService.NOTIFICATION_PICK_HOUR ||
                now.getHours() > SongOfTheDayNotificationService.NOTIFICATION_STOP_HOUR
            ) {
                return
            }

            for (const guild of client.guilds.cache.values()) {
                try {
                    await this.notificationService.sendNotifications(guild, now)
                } catch (e) {
                    console.error(e)
                }
            }
        })
    }
}
