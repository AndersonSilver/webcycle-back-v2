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
import { Course } from './Course.entity';
import { User } from './User.entity';

@Entity('reviews')
@Unique(['courseId', 'userId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  courseId!: string;

  @Column('uuid')
  @Index()
  userId!: string;

  @Column()
  rating!: number;

  @Column('text')
  comment!: string;

  @Column({ default: false })
  @Index()
  approved!: boolean;

  @Column({ default: 0 })
  helpful!: number;

  @Column('simple-array', { nullable: true })
  images?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Course, (course) => course.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course!: Course;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}

