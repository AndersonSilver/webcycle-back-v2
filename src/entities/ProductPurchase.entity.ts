import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Purchase } from './Purchase.entity';
import { Product } from './Product.entity';
import { ShippingTracking } from './ShippingTracking.entity';

@Entity('product_purchases')
export class ProductPurchase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'purchase_id' })
  purchaseId!: string;

  @Column('uuid', { name: 'product_id' })
  productId!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column({ default: 1 })
  quantity!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Purchase, (purchase) => purchase.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_id' })
  purchase!: Purchase;

  @ManyToOne(() => Product, (product) => product.purchases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @OneToOne(() => ShippingTracking, (tracking) => tracking.productPurchase, {
    nullable: true,
  })
  tracking?: ShippingTracking;
}

