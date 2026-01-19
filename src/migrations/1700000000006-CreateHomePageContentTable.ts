import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateHomePageContentTable1700000000006
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'home_page_content',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'hero',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'carousel',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'whyChooseUs',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'testimonials',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'newsletter',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'cta',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('home_page_content');
  }
}

