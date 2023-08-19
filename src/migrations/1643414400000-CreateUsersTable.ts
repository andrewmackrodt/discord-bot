import type { MigrationInterface, QueryRunner } from 'typeorm'
import { Table } from 'typeorm'

export class CreateUsersTable1643414400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'users',
            columns: [
                {
                    isPrimary: true,
                    name: 'id',
                    type: 'varchar',
                },
                {
                    name: 'name',
                    type: 'varchar',
                },
            ],
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('users')
    }
}
