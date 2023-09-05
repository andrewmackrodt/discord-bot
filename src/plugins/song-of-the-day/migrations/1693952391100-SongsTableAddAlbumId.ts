import type { MigrationInterface, QueryRunner } from 'typeorm'
import { TableColumn } from 'typeorm/schema-builder/table/TableColumn'

export class SongsTableAddAlbumId1693952391100 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('songs', [
            new TableColumn({
                name: 'album_id',
                type: 'varchar',
                isNullable: true,
            }),
        ])
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('songs', 'album_id')
    }
}
