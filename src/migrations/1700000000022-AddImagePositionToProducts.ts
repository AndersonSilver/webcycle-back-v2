import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddImagePositionToProducts1700000000022 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'imagePosition',
        type: 'varchar',
        isNullable: true,
        default: "'50% 50%'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('products', 'imagePosition');
  }
}
