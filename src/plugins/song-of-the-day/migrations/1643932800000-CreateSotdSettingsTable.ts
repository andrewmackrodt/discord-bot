import type { MigrationInterface, QueryRunner } from 'typeorm'
import { Table } from 'typeorm'

export class CreateSotdSettingsTable1643932800000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'sotd_settings',
            columns: [
                {
                    isPrimary: true,
                    name: 'server_id',
                    type: 'text',
                },
                {
                    name: 'spotify_client_id',
                    type: 'text',
                },
                {
                    name: 'spotify_client_secret',
                    type: 'text',
                },
                {
                    name: 'spotify_refresh_token',
                    type: 'text',
                },
                {
                    name: 'spotify_playlist_id',
                    type: 'text',
                },
            ],
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('sotd_settings')
    }
}
