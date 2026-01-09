import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBenefitsToJsonb1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alterar coluna benefits de text para jsonb
    await queryRunner.query(`
      ALTER TABLE courses 
      ALTER COLUMN benefits TYPE jsonb 
      USING NULL;
    `);

    // Alterar coluna bonuses de text para jsonb
    await queryRunner.query(`
      ALTER TABLE courses 
      ALTER COLUMN bonuses TYPE jsonb 
      USING NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter para text (simple-array)
    await queryRunner.query(`
      ALTER TABLE courses 
      ALTER COLUMN benefits TYPE text 
      USING CASE 
        WHEN benefits IS NULL THEN NULL
        ELSE benefits::text
      END;
    `);

    await queryRunner.query(`
      ALTER TABLE courses 
      ALTER COLUMN bonuses TYPE text 
      USING CASE 
        WHEN bonuses IS NULL THEN NULL
        ELSE bonuses::text
      END;
    `);
  }
}

