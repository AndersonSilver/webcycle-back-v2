import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ProductPurchase } from './ProductPurchase.entity';
import { TrackingEvent } from './TrackingEvent.entity';

export enum ShippingStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  EXCEPTION = 'exception',
}

@Entity('shipping_trackings')
export class ShippingTracking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'product_purchase_id' })
  productPurchaseId!: string;

  @Column({ nullable: true, name: 'tracking_code' })
  trackingCode?: string;

  @Column({
    type: 'enum',
    enum: ShippingStatus,
    default: ShippingStatus.PENDING,
  })
  status!: ShippingStatus;

  @Column({ nullable: true })
  carrier?: string;

  @Column('jsonb', { nullable: true, name: 'tracking_data' })
  trackingData?: any;

  @Column({ nullable: true, name: 'estimated_delivery_date' })
  estimatedDeliveryDate?: Date;

  @Column({ nullable: true, name: 'delivered_at' })
  deliveredAt?: Date;

  @Column({ nullable: true, name: 'proof_of_delivery_url' })
  proofOfDeliveryUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => ProductPurchase, (productPurchase) => productPurchase.tracking, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_purchase_id' })
  productPurchase!: ProductPurchase;

  @OneToMany(() => TrackingEvent, (event) => event.tracking, { cascade: true })
  events!: TrackingEvent[];
}

