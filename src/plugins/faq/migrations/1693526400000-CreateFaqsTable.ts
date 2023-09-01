import type { MigrationInterface, QueryRunner } from 'typeorm'
import { Table, TableForeignKey, TableIndex } from 'typeorm'

export class CreateFaqsTable1693526400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'faqs',
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
                    name: 'name',
                    type: 'varchar',
                },
                {
                    name: 'content',
                    type: 'text',
                },
                {
                    name: 'author_id',
                    type: 'varchar',
                },
                {
                    name: 'created_at',
                    type: 'datetime',
                    default: "datetime('now')",
                },
                {
                    name: 'updated_at',
                    type: 'datetime',
                    default: "datetime('now')",
                },
            ],
        }))

        await queryRunner.createIndices('faqs', [
            new TableIndex({
                name: 'faqs_server_id_name_uindex',
                isUnique: true,
                columnNames: ['server_id', 'name'],
            }),
            new TableIndex({
                name: 'faqs_author_id_index',
                columnNames: ['author_id'],
            }),
        ])

        await queryRunner.createForeignKey('faqs', new TableForeignKey({
            name: 'faqs_author_id_users_id_fkey',
            columnNames: ['author_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('faqs')
    }
}
