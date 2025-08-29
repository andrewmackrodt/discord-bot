import type { MigrationInterface, QueryRunner } from 'typeorm'
import { TableColumn } from 'typeorm/schema-builder/table/TableColumn'

export class SongsTableAddPlaycount1693952391000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('songs', [
            new TableColumn({
                name: 'message_id',
                type: 'varchar',
                isNullable: true,
            }),
            new TableColumn({
                name: 'playcount',
                type: 'integer',
                isNullable: true,
            }),
            new TableColumn({
                name: 'playcount_updated_at',
                type: 'datetime',
                isNullable: true,
            }),
            new TableColumn({
                name: 'created_at',
                type: 'datetime',
                default: "datetime('now')",
            }),
            new TableColumn({
                name: 'updated_at',
                type: 'datetime',
                default: "datetime('now')",
            }),
        ])
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns('songs', [
            'updated_at',
            'created_at',
            'playcount_updated_at',
            'playcount',
            'message_id',
        ])
    }
}
