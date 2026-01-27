import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShippingAddressToPurchases1700000000014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ 
      BEGIN
          -- Rua
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'purchases' AND column_name = 'shipping_street') THEN
              ALTER TABLE purchases ADD COLUMN shipping_street VARCHAR;
          END IF;

          -- Número
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'purchases' AND column_name = 'shipping_number') THEN
              ALTER TABLE purchases ADD COLUMN shipping_number VARCHAR;
          END IF;

          -- Complemento
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'purchases' AND column_name = 'shipping_complement') THEN
              ALTER TABLE purchases ADD COLUMN shipping_complement VARCHAR;
          END IF;

          -- Bairro
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'purchases' AND column_name = 'shipping_neighborhood') THEN
              ALTER TABLE purchases ADD COLUMN shipping_neighborhood VARCHAR;
          END IF;

          -- Cidade
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'purchases' AND column_name = 'shipping_city') THEN
              ALTER TABLE purchases ADD COLUMN shipping_city VARCHAR;
          END IF;

          -- Estado
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'purchases' AND column_name = 'shipping_state') THEN
              ALTER TABLE purchases ADD COLUMN shipping_state VARCHAR;
          END IF;

          -- CEP
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'purchases' AND column_name = 'shipping_zip_code') THEN
              ALTER TABLE purchases ADD COLUMN shipping_zip_code VARCHAR;
          END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('purchases', 'shipping_street');
    await queryRunner.dropColumn('purchases', 'shipping_number');
    await queryRunner.dropColumn('purchases', 'shipping_complement');
    await queryRunner.dropColumn('purchases', 'shipping_neighborhood');
    await queryRunner.dropColumn('purchases', 'shipping_city');
    await queryRunner.dropColumn('purchases', 'shipping_state');
    await queryRunner.dropColumn('purchases', 'shipping_zip_code');
  }
}

