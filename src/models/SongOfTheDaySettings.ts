import { Column, BaseEntity, Entity, PrimaryColumn } from 'typeorm'

export enum NotificationEventType {
    PICK = 'pick',
    OPEN = 'open',
}

@Entity({ name: 'sotd_settings' })
export class SongOfTheDaySettings extends BaseEntity {
    @PrimaryColumn({ name: 'server_id' })
    public serverId!: number

    @Column({ name: 'spotify_client_id' })
    public spotifyClientId!: string

    @Column({ name: 'spotify_client_secret' })
    public spotifyClientSecret!: string

    @Column({ name: 'spotify_refresh_token' })
    public spotifyRefreshToken!: string

    @Column({ name: 'spotify_playlist_id' })
    public spotifyPlaylistId!: string

    @Column({ name: 'notifications_channel_id', nullable: true })
    public notificationsChannelId?: string

    @Column({ name: 'notifications_last_event_type', nullable: true })
    public notificationsLastEventType?: NotificationEventType

    @Column({ name: 'notifications_last_event_time', nullable: true })
    public notificationsLastEventTime?: string
}
