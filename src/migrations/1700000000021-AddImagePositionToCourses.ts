import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddImagePositionToCourses1700000000021 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'courses',
      new TableColumn({
        name: 'imagePosition',
        type: 'varchar',
        isNullable: true,
        default: "'50% 50%'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('courses', 'imagePosition');
  }
}
