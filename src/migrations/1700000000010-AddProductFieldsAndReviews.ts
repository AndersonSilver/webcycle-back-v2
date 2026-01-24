import { MigrationInterface, QueryRunner, TableColumn, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddProductFieldsAndReviews1700000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a coluna 'author' já existe
    const productsTable = await queryRunner.getTable('products');
    const hasAuthor = productsTable?.findColumnByName('author');
    
    if (!hasAuthor) {
      // Adicionar campo author
      await queryRunner.addColumn(
        'products',
        new TableColumn({
          name: 'author',
          type: 'varchar',
          isNullable: true,
        })
      );
    }

    // Verificar se a coluna 'pages' já existe
    const hasPages = productsTable?.findColumnByName('pages');
    if (!hasPages) {
      // Adicionar campo pages
      await queryRunner.addColumn(
        'products',
        new TableColumn({
          name: 'pages',
          type: 'int',
          isNullable: true,
        })
      );
    }

    // Verificar se a coluna 'rating' já existe
    const hasRating = productsTable?.findColumnByName('rating');
    if (!hasRating) {
      // Adicionar campo rating
      await queryRunner.addColumn(
        'products',
        new TableColumn({
          name: 'rating',
          type: 'decimal',
          precision: 3,
          scale: 2,
          default: 0,
        })
      );
    }

    // Verificar se a coluna 'reviews_count' já existe
    const hasReviewsCount = productsTable?.findColumnByName('reviews_count');
    if (!hasReviewsCount) {
      // Adicionar campo reviews_count
      await queryRunner.addColumn(
        'products',
        new TableColumn({
          name: 'reviews_count',
          type: 'int',
          default: 0,
        })
      );
    }

    // Verificar se a tabela product_reviews já existe
    const productReviewsTable = await queryRunner.getTable('product_reviews');
    if (!productReviewsTable) {
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
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover tabela de avaliações de produtos
    const productReviewsTable = await queryRunner.getTable('product_reviews');
    if (productReviewsTable) {
      await queryRunner.dropTable('product_reviews');
    }

    // Remover colunas da tabela products
    const productsTable = await queryRunner.getTable('products');
    
    if (productsTable?.findColumnByName('reviews_count')) {
      await queryRunner.dropColumn('products', 'reviews_count');
    }
    
    if (productsTable?.findColumnByName('rating')) {
      await queryRunner.dropColumn('products', 'rating');
    }
    
    if (productsTable?.findColumnByName('pages')) {
      await queryRunner.dropColumn('products', 'pages');
    }
    
    if (productsTable?.findColumnByName('author')) {
      await queryRunner.dropColumn('products', 'author');
    }
  }
}

