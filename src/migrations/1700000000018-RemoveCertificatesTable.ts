import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCertificatesTable1700000000018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('certificates', true);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Não recriar a tabela automaticamente
  }
}

