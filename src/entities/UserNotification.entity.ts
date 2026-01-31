import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User.entity';

export enum NotificationType {
  PURCHASE_CONFIRMED = 'purchase_confirmed',
  COURSE_AVAILABLE = 'course_available',
  NEW_CONTENT = 'new_content',
  REMINDER = 'reminder',
}

@Entity('user_notifications')
export class UserNotification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  userId!: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  @Column()
  title!: string;

  @Column('text')
  message!: string;

  @Column({ default: false })
  read!: boolean;

  @Column({ nullable: true })
  link?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}

