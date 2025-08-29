import type { MigrationInterface, QueryRunner } from 'typeorm'
import { TableColumn } from 'typeorm'

export class AddSotdSettingsNotificationsColumns1643932801000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('sotd_settings', [
            new TableColumn({
                name: 'notifications_channel_id',
                type: 'varchar',
                isNullable: true,
            }),
            new TableColumn({
                name: 'notifications_last_event_type',
                type: 'varchar',
                isNullable: true,
            }),
            new TableColumn({
                name: 'notifications_last_event_time',
                type: 'varchar',
                isNullable: true,
            }),
        ])
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns('sotd_settings', [
            'notifications_channel_id',
            'notifications_last_event_type',
            'notifications_last_event_time',
        ])
    }
}
