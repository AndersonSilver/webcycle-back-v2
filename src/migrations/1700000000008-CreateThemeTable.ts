import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateThemeTable1700000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'themes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'primary',
            type: 'varchar',
            length: '7',
            default: "'#3B82F6'",
          },
          {
            name: 'primaryDark',
            type: 'varchar',
            length: '7',
            default: "'#2563EB'",
          },
          {
            name: 'primaryLight',
            type: 'varchar',
            length: '7',
            default: "'#60A5FA'",
          },
          {
            name: 'secondary',
            type: 'varchar',
            length: '7',
            default: "'#10B981'",
          },
          {
            name: 'secondaryDark',
            type: 'varchar',
            length: '7',
            default: "'#059669'",
          },
          {
            name: 'textPrimary',
            type: 'varchar',
            length: '7',
            default: "'#1F2937'",
          },
          {
            name: 'textSecondary',
            type: 'varchar',
            length: '7',
            default: "'#6B7280'",
          },
          {
            name: 'background',
            type: 'varchar',
            length: '7',
            default: "'#FFFFFF'",
          },
          {
            name: 'backgroundSecondary',
            type: 'varchar',
            length: '7',
            default: "'#F9FAFB'",
          },
          {
            name: 'border',
            type: 'varchar',
            length: '7',
            default: "'#E5E7EB'",
          },
          {
            name: 'accent',
            type: 'varchar',
            length: '7',
            default: "'#F59E0B'",
          },
          {
            name: 'danger',
            type: 'varchar',
            length: '7',
            default: "'#EF4444'",
          },
          {
            name: 'success',
            type: 'varchar',
            length: '7',
            default: "'#10B981'",
          },
          {
            name: 'info',
            type: 'varchar',
            length: '7',
            default: "'#6366F1'",
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
    await queryRunner.dropTable('themes');
  }
}

