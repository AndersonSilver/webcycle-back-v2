import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLandingBannersToHomePageContent1700000000019
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'home_page_content',
      new TableColumn({
        name: 'landingBanners',
        type: 'jsonb',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('home_page_content', 'landingBanners');
  }
}
