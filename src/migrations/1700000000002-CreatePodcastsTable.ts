import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePodcastsTable1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela podcasts
    await queryRunner.createTable(
      new Table({
        name: 'podcasts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'image',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'videoUrl',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'duration',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'listens',
            type: 'integer',
            default: 0,
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'tags',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Criar índices
    await queryRunner.createIndex(
      'podcasts',
      new TableIndex({
        name: 'IDX_podcasts_active',
        columnNames: ['active'],
      })
    );

    await queryRunner.createIndex(
      'podcasts',
      new TableIndex({
        name: 'IDX_podcasts_createdAt',
        columnNames: ['createdAt'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('podcasts', 'IDX_podcasts_createdAt');
    await queryRunner.dropIndex('podcasts', 'IDX_podcasts_active');

    // Remover tabela
    await queryRunner.dropTable('podcasts');
  }
}

