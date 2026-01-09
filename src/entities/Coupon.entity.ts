import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Purchase } from './Purchase.entity';
import { Course } from './Course.entity';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  discount!: number;

  @Column({
    type: 'enum',
    enum: DiscountType,
  })
  type!: DiscountType;

  @Column({ nullable: true })
  expiresAt?: Date;

  @Column({ default: 0 })
  maxUses!: number;

  @Column({ default: 0 })
  currentUses!: number;

  @Column('simple-array', { nullable: true })
  applicableCourses?: string[];

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Purchase, (purchase) => purchase.coupon)
  purchases!: Purchase[];

  @ManyToMany(() => Course, (course) => course.coupons)
  @JoinTable({ name: 'coupon_courses' })
  courses!: Course[];
}

