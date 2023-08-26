import type { MigrationInterface, QueryRunner } from 'typeorm'
import { Table, TableForeignKey, TableIndex } from 'typeorm'

export class CreateNominationsTable1649116800000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'sotd_nominations',
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
                    name: 'user_id',
                    type: 'varchar',
                },
                {
                    name: 'date',
                    type: 'varchar',
                },
            ],
        }))

        await queryRunner.createIndices('sotd_nominations', [
            new TableIndex({
                name: 'sotd_nominations_server_id_index',
                columnNames: ['server_id'],
            }),
        ])

        await queryRunner.createForeignKey('sotd_nominations', new TableForeignKey({
            name: 'sotd_nominations_user_id_users_id_fkey',
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('sotd_nominations')
    }
}
