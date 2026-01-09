import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Purchase } from './Purchase.entity';
import { Progress } from './Progress.entity';
import { Review } from './Review.entity';
import { CartItem } from './CartItem.entity';
import { Certificate } from './Certificate.entity';
import { Favorite } from './Favorite.entity';
import { UserNotification } from './UserNotification.entity';
import { Refund } from './Refund.entity';
import { ShareToken } from './ShareToken.entity';

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  @Exclude()
  password?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role!: UserRole;

  @Column({ nullable: true, unique: true })
  googleId?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ default: false })
  emailVerified!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Purchase, (purchase) => purchase.user)
  purchases!: Purchase[];

  @OneToMany(() => Progress, (progress) => progress.user)
  progress!: Progress[];

  @OneToMany(() => Review, (review) => review.user)
  reviews!: Review[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.user)
  cartItems!: CartItem[];

  @OneToMany(() => Certificate, (certificate) => certificate.user)
  certificates!: Certificate[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites!: Favorite[];

  @OneToMany(() => UserNotification, (notification) => notification.user)
  notifications!: UserNotification[];

  @OneToMany(() => Refund, (refund) => refund.user)
  refunds!: Refund[];

  @OneToMany(() => ShareToken, (shareToken) => shareToken.user)
  shareTokens!: ShareToken[];
}

