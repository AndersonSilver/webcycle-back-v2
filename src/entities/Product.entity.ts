import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductPurchase } from './ProductPurchase.entity';
import { ProductReview } from './ProductReview.entity';

export enum ProductType {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
}

export enum DigitalContentType {
  URL = 'url',
  UPLOAD = 'upload',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, name: 'original_price' })
  originalPrice?: number;

  @Column()
  image!: string;

  @Column('simple-array', { nullable: true })
  images?: string[];

  @Column({
    type: 'enum',
    enum: ProductType,
  })
  type!: ProductType;

  @Column({ nullable: true })
  category?: string;

  @Column({ default: 0 })
  stock!: number;

  @Column({ default: true })
  active!: boolean;

  @Column('text', { nullable: true, name: 'digital_file_url' })
  digitalFileUrl?: string;

  @Column({
    type: 'enum',
    enum: DigitalContentType,
    nullable: true,
    name: 'digital_content_type',
  })
  digitalContentType?: DigitalContentType; // 'url' ou 'upload'

  @Column('jsonb', { nullable: true })
  specifications?: Record<string, any>;

  @Column({ nullable: true })
  author?: string; // Autor/Instrutor do produto

  @Column({ nullable: true, name: 'pages' })
  pages?: number; // Quantidade de páginas (para livros)

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating!: number; // Avaliação média (0-5)

  @Column({ default: 0, name: 'reviews_count' })
  reviewsCount!: number; // Quantidade de avaliações

  @Column({ default: 0, name: 'sales_count' })
  salesCount!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ProductPurchase, (productPurchase) => productPurchase.product)
  purchases!: ProductPurchase[];

  @OneToMany(() => ProductReview, (review) => review.product)
  reviews!: ProductReview[];
}

