import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateProductsTables1700000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela de produtos
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'original_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'image',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'images',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['physical', 'digital'],
            isNullable: false,
          },
          {
            name: 'category',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'stock',
            type: 'int',
            default: 0,
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'digital_file_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'specifications',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'author',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'pages',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: 0,
          },
          {
            name: 'reviews_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'sales_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Criar índices para produtos
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCTS_TYPE',
        columnNames: ['type'],
      })
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCTS_CATEGORY',
        columnNames: ['category'],
      })
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCTS_ACTIVE',
        columnNames: ['active'],
      })
    );

    // Criar tabela de compras de produtos
    await queryRunner.createTable(
      new Table({
        name: 'product_purchases',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'purchase_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'int',
            default: 1,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Criar foreign keys para product_purchases
    await queryRunner.createForeignKey(
      'product_purchases',
      new TableForeignKey({
        columnNames: ['purchase_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'purchases',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'product_purchases',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      })
    );

    // Criar tabela de tracking de envio
    await queryRunner.createTable(
      new Table({
        name: 'shipping_trackings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'product_purchase_id',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'tracking_code',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'pending',
              'preparing',
              'shipped',
              'in_transit',
              'out_for_delivery',
              'delivered',
              'returned',
              'exception',
            ],
            default: "'pending'",
          },
          {
            name: 'carrier',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'tracking_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'estimated_delivery_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'delivered_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Criar foreign key para shipping_trackings
    await queryRunner.createForeignKey(
      'shipping_trackings',
      new TableForeignKey({
        columnNames: ['product_purchase_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'product_purchases',
        onDelete: 'CASCADE',
      })
    );

    // Criar índice para tracking code
    await queryRunner.createIndex(
      'shipping_trackings',
      new TableIndex({
        name: 'IDX_TRACKING_CODE',
        columnNames: ['tracking_code'],
      })
    );

    // Criar tabela de eventos de tracking
    await queryRunner.createTable(
      new Table({
        name: 'tracking_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tracking_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Criar foreign key para tracking_events
    await queryRunner.createForeignKey(
      'tracking_events',
      new TableForeignKey({
        columnNames: ['tracking_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_trackings',
        onDelete: 'CASCADE',
      })
    );

    // Criar tabela de avaliações de produtos
    await queryRunner.createTable(
      new Table({
        name: 'product_reviews',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'rating',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'approved',
            type: 'boolean',
            default: false,
          },
          {
            name: 'helpful',
            type: 'int',
            default: 0,
          },
          {
            name: 'images',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Criar foreign keys para product_reviews
    await queryRunner.createForeignKey(
      'product_reviews',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'product_reviews',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Criar índice único para evitar avaliações duplicadas
    await queryRunner.createIndex(
      'product_reviews',
      new TableIndex({
        name: 'IDX_PRODUCT_REVIEW_UNIQUE',
        columnNames: ['product_id', 'user_id'],
        isUnique: true,
      })
    );

    // Criar índice para eventos por tracking
    await queryRunner.createIndex(
      'tracking_events',
      new TableIndex({
        name: 'IDX_TRACKING_EVENTS_TRACKING',
        columnNames: ['tracking_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover tabela de avaliações de produtos
    await queryRunner.dropTable('product_reviews');
    // Remover tabelas na ordem inversa
    await queryRunner.dropTable('tracking_events', true);
    await queryRunner.dropTable('shipping_trackings', true);
    await queryRunner.dropTable('product_purchases', true);
    await queryRunner.dropTable('products', true);
  }
}

