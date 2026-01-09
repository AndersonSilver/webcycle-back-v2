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
import { Module } from './Module.entity';
import { PurchaseCourse } from './PurchaseCourse.entity';
import { Progress } from './Progress.entity';
import { Review } from './Review.entity';
import { CartItem } from './CartItem.entity';
import { Coupon } from './Coupon.entity';
import { Certificate } from './Certificate.entity';
import { Favorite } from './Favorite.entity';
import { ShareToken } from './ShareToken.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  subtitle?: string;

  @Column('text')
  description!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  originalPrice?: number;

  @Column()
  category!: string;

  @Column()
  image!: string;

  @Column({ nullable: true })
  videoUrl?: string;

  @Column()
  instructor!: string;

  @Column()
  duration!: string;

  @Column({ default: 0 })
  lessons!: number;

  @Column({ default: 0 })
  students!: number;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating!: number;

  @Column('text', { nullable: true })
  aboutCourse?: string;

  @Column('jsonb', { nullable: true })
  benefits?: Array<{ icon: string; title: string; description?: string }>;

  @Column('jsonb', { nullable: true })
  bonuses?: Array<{ icon: string; title: string; description?: string }>;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Module, (module) => module.course, { cascade: true })
  modules!: Module[];

  @OneToMany(() => PurchaseCourse, (purchaseCourse) => purchaseCourse.course)
  purchaseCourses!: PurchaseCourse[];

  @OneToMany(() => Review, (review) => review.course)
  reviews!: Review[];

  @OneToMany(() => Progress, (progress) => progress.course)
  progress!: Progress[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.course)
  cartItems!: CartItem[];

  @ManyToMany(() => Coupon, (coupon) => coupon.applicableCourses)
  @JoinTable({ name: 'coupon_courses' })
  coupons!: Coupon[];

  @OneToMany(() => Certificate, (certificate) => certificate.course)
  certificates!: Certificate[];

  @OneToMany(() => Favorite, (favorite) => favorite.course)
  favorites!: Favorite[];

  @OneToMany(() => ShareToken, (shareToken) => shareToken.course)
  shareTokens!: ShareToken[];
}

