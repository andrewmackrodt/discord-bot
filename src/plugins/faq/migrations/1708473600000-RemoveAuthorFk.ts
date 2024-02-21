import type { MigrationInterface, QueryRunner } from 'typeorm'
import { TableForeignKey } from 'typeorm'

export class RemoveAuthorFk1708473600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('faqs', 'faqs_author_id_users_id_fkey')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createForeignKey('faqs', new TableForeignKey({
            name: 'faqs_author_id_users_id_fkey',
            columnNames: ['author_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
        }))
    }
}
