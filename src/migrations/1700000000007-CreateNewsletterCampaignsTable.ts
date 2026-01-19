import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateNewsletterCampaignsTable1700000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'newsletter_campaigns',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'ctaText',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'ctaLink',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'totalRecipients',
            type: 'int',
            default: 0,
          },
          {
            name: 'sentCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'failedCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'recipientEmails',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'failedEmails',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'sentByUserId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'sentAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Criar foreign key para sentByUser
    await queryRunner.createForeignKey(
      'newsletter_campaigns',
      new TableForeignKey({
        columnNames: ['sentByUserId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('newsletter_campaigns');
    if (table) {
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('sentByUserId') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('newsletter_campaigns', foreignKey);
      }
    }
    await queryRunner.dropTable('newsletter_campaigns');
  }
}

