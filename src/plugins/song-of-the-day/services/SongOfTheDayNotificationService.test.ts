import type { Guild, GuildBasedChannel } from 'discord.js'
import { ChannelType } from 'discord.js'
import { It, mock, UnexpectedProperty, when } from 'strong-mock'

import { SongOfTheDayNotificationService } from './SongOfTheDayNotificationService'
import type { SongOfTheDaySettings } from '../models/SongOfTheDaySettings'
import type { SongOfTheDayRepository } from '../repositories/SongOfTheDayRepository'

describe('sendNotifications()', () => {
    let mockRepository: SongOfTheDayRepository
    let mockGuild: Guild
    let notificationService: SongOfTheDayNotificationService
    let mockSettings: SongOfTheDaySettings

    function mockChannelsCache() {
        const mockChannels = mock<typeof mockGuild.channels>()
        const mockCache = mock<typeof mockChannels.cache>()
        when(() => mockChannels.cache).thenReturn(mockCache)
        when(() => mockGuild.channels).thenReturn(mockChannels)
        return mockCache
    }

    function assertSotdPendingForChannelType(type: ChannelType.GuildText | ChannelType.GuildVoice) {
        when(() => mockRepository.getServerSettings(It.isAny())).thenResolve(mockSettings)
        when(() => mockSettings.notificationsChannelId)
            .thenReturn('ch')
            .anyTimes()
        when(() =>
            mockRepository.serverContainsSongOfTheDayOnDate(It.isAny(), It.isAny()),
        ).thenResolve(false)
        const mockChannel = mock<GuildBasedChannel>()
        const mockCache = mockChannelsCache()
        when(() => mockCache.get(It.isAny())).thenReturn(mockChannel)
        when(() => mockChannel.type)
            .thenReturn(type)
            .anyTimes()
        return mockChannel
    }

    beforeEach(() => {
        mockRepository = mock<SongOfTheDayRepository>()
        mockGuild = mock<Guild>({ unexpectedProperty: UnexpectedProperty.CALL_THROW })
        notificationService = new SongOfTheDayNotificationService(mockRepository)
        mockSettings = mock<SongOfTheDaySettings>()
    })

    it('sends nothing when notificationsChannelId is undefined', async () => {
        when(() => mockRepository.getServerSettings(It.isAny())).thenResolve(mockSettings)
        when(() => mockSettings.notificationsChannelId).thenReturn(undefined)
        await notificationService.sendNotifications(mockGuild)
    })

    it('sends nothing when sotd not empty', async () => {
        when(() => mockRepository.getServerSettings(It.isAny())).thenResolve(mockSettings)
        when(() => mockSettings.notificationsChannelId)
            .thenReturn('ch')
            .anyTimes()
        when(() =>
            mockRepository.serverContainsSongOfTheDayOnDate(It.isAny(), It.isAny()),
        ).thenResolve(true)
        await notificationService.sendNotifications(mockGuild)
    })

    it('sends nothing when channel not text', async () => {
        assertSotdPendingForChannelType(ChannelType.GuildVoice)
        await notificationService.sendNotifications(mockGuild)
    })
})
