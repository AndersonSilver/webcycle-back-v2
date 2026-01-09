import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSupportTables1700000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela support_tickets
    await queryRunner.createTable(
      new Table({
        name: 'support_tickets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'adminId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['open', 'in_progress', 'closed'],
            default: "'open'",
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['low', 'medium', 'high'],
            default: "'medium'",
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
          },
          {
            name: 'closedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Criar tabela support_messages
    await queryRunner.createTable(
      new Table({
        name: 'support_messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'ticketId',
            type: 'uuid',
          },
          {
            name: 'senderId',
            type: 'uuid',
          },
          {
            name: 'senderType',
            type: 'enum',
            enum: ['user', 'admin'],
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'readAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Foreign Keys para support_tickets
    await queryRunner.createForeignKey(
      'support_tickets',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'support_tickets',
      new TableForeignKey({
        columnNames: ['adminId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      })
    );

    // Foreign Keys para support_messages
    await queryRunner.createForeignKey(
      'support_messages',
      new TableForeignKey({
        columnNames: ['ticketId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'support_tickets',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'support_messages',
      new TableForeignKey({
        columnNames: ['senderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Índices
    await queryRunner.createIndex(
      'support_tickets',
      new TableIndex({
        name: 'IDX_SUPPORT_TICKETS_USER',
        columnNames: ['userId'],
      })
    );

    await queryRunner.createIndex(
      'support_tickets',
      new TableIndex({
        name: 'IDX_SUPPORT_TICKETS_STATUS',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'support_messages',
      new TableIndex({
        name: 'IDX_SUPPORT_MESSAGES_TICKET',
        columnNames: ['ticketId'],
      })
    );

    await queryRunner.createIndex(
      'support_messages',
      new TableIndex({
        name: 'IDX_SUPPORT_MESSAGES_READ',
        columnNames: ['read'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('support_messages');
    await queryRunner.dropTable('support_tickets');
  }
}

