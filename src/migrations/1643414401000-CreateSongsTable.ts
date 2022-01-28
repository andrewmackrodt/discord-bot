import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm'

export class CreateSongsTable1643414401000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
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
                    name: 'track_id',
                    type: 'text',
                },
                {
                    name: 'artist',
                    type: 'text',
                },
                {
                    name: 'title',
                    type: 'text',
                },
                {
                    name: 'date',
                    type: 'text',
                },
                {
                    name: 'user_id',
                    type: 'text',
                },
            ],
        }))

        await queryRunner.createForeignKey('songs', new TableForeignKey({
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('songs')
    }
}
