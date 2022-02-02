import { Column, BaseEntity, Entity, PrimaryColumn } from 'typeorm'

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
}
