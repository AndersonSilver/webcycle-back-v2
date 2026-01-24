import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Product } from './Product.entity';
import { User } from './User.entity';

@Entity('product_reviews')
@Unique(['productId', 'userId'])
export class ProductReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  productId!: string;

  @Column('uuid')
  @Index()
  userId!: string;

  @Column()
  rating!: number; // 1-5

  @Column('text')
  comment!: string;

  @Column({ default: false })
  @Index()
  approved!: boolean;

  @Column({ default: 0 })
  helpful!: number;

  @Column('simple-array', { nullable: true })
  images?: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Product, (product) => product.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => User, (user) => user.productReviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

