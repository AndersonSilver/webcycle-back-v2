import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './User.entity';
import { Course } from './Course.entity';

@Entity('favorites')
@Unique(['userId', 'courseId'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  courseId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Course, (course) => course.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course!: Course;
}

