import type { MigrationInterface, QueryRunner } from 'typeorm'
import { TableColumn } from 'typeorm/schema-builder/table/TableColumn'

export class SongsTableAddReleaseDate1694044800000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn('songs', 'date', new TableColumn({
            name: 'date',
            type: 'date',
        }))

        await queryRunner.addColumns('songs', [
            new TableColumn({
                name: 'release_date',
                type: 'date',
                isNullable: true,
            }),
        ])
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('songs', 'release_date')

        await queryRunner.changeColumn('songs', 'date', new TableColumn({
            name: 'date',
            type: 'varchar',
        }))
    }
}
