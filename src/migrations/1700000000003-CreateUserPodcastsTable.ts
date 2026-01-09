import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class CreateUserPodcastsTable1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_podcasts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'podcastId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'addedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Criar índices
    await queryRunner.createIndex(
      'user_podcasts',
      new TableIndex({
        name: 'IDX_user_podcasts_userId',
        columnNames: ['userId'],
      })
    );

    await queryRunner.createIndex(
      'user_podcasts',
      new TableIndex({
        name: 'IDX_user_podcasts_podcastId',
        columnNames: ['podcastId'],
      })
    );

    // Criar constraint único para evitar duplicatas
    await queryRunner.createUniqueConstraint(
      'user_podcasts',
      new TableUnique({
        name: 'UQ_user_podcasts_userId_podcastId',
        columnNames: ['userId', 'podcastId'],
      })
    );

    // Criar foreign keys
    await queryRunner.createForeignKey(
      'user_podcasts',
      new TableForeignKey({
        name: 'FK_user_podcasts_userId',
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'user_podcasts',
      new TableForeignKey({
        name: 'FK_user_podcasts_podcastId',
        columnNames: ['podcastId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'podcasts',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    const table = await queryRunner.getTable('user_podcasts');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('user_podcasts', fk);
      }
    }

    // Remover constraint único
    await queryRunner.dropUniqueConstraint('user_podcasts', 'UQ_user_podcasts_userId_podcastId');
    
    // Remover índices
    await queryRunner.dropIndex('user_podcasts', 'IDX_user_podcasts_podcastId');
    await queryRunner.dropIndex('user_podcasts', 'IDX_user_podcasts_userId');
    
    // Remover tabela
    await queryRunner.dropTable('user_podcasts');
  }
}
