import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm'

export enum NotificationEventType {
    PICK = 'pick',
    OPEN = 'open',
}

@Entity({ name: 'sotd_settings' })
export class SongOfTheDaySettings extends BaseEntity {
    @PrimaryColumn({ name: 'server_id' })
    serverId!: string

    @Column({ name: 'spotify_client_id' })
    spotifyClientId!: string

    @Column({ name: 'spotify_client_secret' })
    spotifyClientSecret!: string

    @Column({ name: 'spotify_refresh_token' })
    spotifyRefreshToken!: string

    @Column({ name: 'spotify_playlist_id' })
    spotifyPlaylistId!: string

    @Column({ name: 'notifications_channel_id', nullable: true })
    notificationsChannelId?: string

    @Column({ name: 'notifications_last_event_type', nullable: true })
    notificationsLastEventType?: NotificationEventType

    @Column({ name: 'notifications_last_event_time', nullable: true })
    notificationsLastEventTime?: string
}
