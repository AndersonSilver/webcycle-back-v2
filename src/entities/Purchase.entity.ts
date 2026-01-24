import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';
import { Coupon } from './Coupon.entity';
import { PurchaseCourse } from './PurchaseCourse.entity';
import { ProductPurchase } from './ProductPurchase.entity';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  PIX = 'pix',
  BOLETO = 'boleto',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  finalAmount!: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;

  @Column({ nullable: true })
  paymentId?: string;

  @Column('uuid', { nullable: true })
  couponId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.purchases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Coupon, (coupon) => coupon.purchases, { nullable: true })
  @JoinColumn({ name: 'couponId' })
  coupon?: Coupon;

  @OneToMany(() => PurchaseCourse, (purchaseCourse) => purchaseCourse.purchase, {
    cascade: true,
  })
  courses!: PurchaseCourse[];

  @OneToMany(() => ProductPurchase, (productPurchase) => productPurchase.purchase, {
    cascade: true,
  })
  products!: ProductPurchase[];
}

