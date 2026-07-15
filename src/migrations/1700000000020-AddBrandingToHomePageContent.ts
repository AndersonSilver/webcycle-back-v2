import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBrandingToHomePageContent1700000000020
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'home_page_content',
      new TableColumn({
        name: 'branding',
        type: 'jsonb',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('home_page_content', 'branding');
  }
}
