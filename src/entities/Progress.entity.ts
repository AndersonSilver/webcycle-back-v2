import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from './User.entity';
import { Course } from './Course.entity';
import { Lesson } from './Lesson.entity';

@Entity('progress')
@Unique(['userId', 'lessonId'])
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  userId!: string;

  @Column('uuid')
  @Index()
  courseId!: string;

  @Column('uuid')
  @Index()
  lessonId!: string;

  @Column({ default: false })
  completed!: boolean;

  @Column({ default: 0 })
  watchedDuration!: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  lastAccessed!: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @ManyToOne(() => User, (user) => user.progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Course, (course) => course.progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course!: Course;

  @ManyToOne(() => Lesson, (lesson) => lesson.progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson!: Lesson;
}

