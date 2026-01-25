import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDigitalContentTypeToProducts1700000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para digital_content_type se não existir
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "digital_content_type_enum" AS ENUM ('url', 'upload');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Adicionar coluna digital_content_type
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'digital_content_type',
        type: 'enum',
        enum: ['url', 'upload'],
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover coluna
    await queryRunner.dropColumn('products', 'digital_content_type');
    
    // Remover enum (se não estiver sendo usado em outro lugar)
    await queryRunner.query(`DROP TYPE IF EXISTS "digital_content_type_enum";`);
  }
}

