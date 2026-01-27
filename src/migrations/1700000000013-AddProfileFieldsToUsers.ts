import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileFieldsToUsers1700000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Usar SQL direto para verificar se as colunas já existem antes de adicionar
    await queryRunner.query(`
      DO $$ 
      BEGIN
          -- Telefone
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'phone') THEN
              ALTER TABLE users ADD COLUMN phone VARCHAR;
          END IF;

          -- Documento
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'document') THEN
              ALTER TABLE users ADD COLUMN document VARCHAR;
          END IF;

          -- Endereço - Rua
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'address_street') THEN
              ALTER TABLE users ADD COLUMN address_street VARCHAR;
          END IF;

          -- Endereço - Número
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'address_number') THEN
              ALTER TABLE users ADD COLUMN address_number VARCHAR;
          END IF;

          -- Endereço - Complemento
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'address_complement') THEN
              ALTER TABLE users ADD COLUMN address_complement VARCHAR;
          END IF;

          -- Endereço - Bairro
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'address_neighborhood') THEN
              ALTER TABLE users ADD COLUMN address_neighborhood VARCHAR;
          END IF;

          -- Endereço - Cidade
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'address_city') THEN
              ALTER TABLE users ADD COLUMN address_city VARCHAR;
          END IF;

          -- Endereço - Estado
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'address_state') THEN
              ALTER TABLE users ADD COLUMN address_state VARCHAR;
          END IF;

          -- Endereço - CEP
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'users' AND column_name = 'address_zip_code') THEN
              ALTER TABLE users ADD COLUMN address_zip_code VARCHAR;
          END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'phone');
    await queryRunner.dropColumn('users', 'document');
    await queryRunner.dropColumn('users', 'address_street');
    await queryRunner.dropColumn('users', 'address_number');
    await queryRunner.dropColumn('users', 'address_complement');
    await queryRunner.dropColumn('users', 'address_neighborhood');
    await queryRunner.dropColumn('users', 'address_city');
    await queryRunner.dropColumn('users', 'address_state');
    await queryRunner.dropColumn('users', 'address_zip_code');
  }
}

