import type { MigrationInterface, QueryRunner } from 'typeorm'
import { Table, TableForeignKey, TableIndex } from 'typeorm'

export class CreateSongsTable1643414401000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'songs',
                columns: [
                    {
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                        name: 'id',
                        type: 'integer',
                    },
                    {
                        name: 'server_id',
                        type: 'varchar',
                    },
                    {
                        name: 'track_id',
                        type: 'varchar',
                    },
                    {
                        name: 'artist',
                        type: 'varchar',
                    },
                    {
                        name: 'title',
                        type: 'varchar',
                    },
                    {
                        name: 'date',
                        type: 'varchar',
                    },
                    {
                        name: 'user_id',
                        type: 'varchar',
                    },
                ],
            }),
        )

        await queryRunner.createIndices('songs', [
            new TableIndex({
                name: 'songs_server_id_track_id_uindex',
                isUnique: true,
                columnNames: ['server_id', 'track_id'],
            }),
            new TableIndex({
                name: 'songs_user_id_index',
                columnNames: ['user_id'],
            }),
        ])

        await queryRunner.createForeignKey(
            'songs',
            new TableForeignKey({
                name: 'songs_user_id_users_id_fkey',
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        )
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('songs')
    }
}
