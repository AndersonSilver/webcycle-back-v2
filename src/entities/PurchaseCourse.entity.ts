import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Purchase } from './Purchase.entity';
import { Course } from './Course.entity';

@Entity('purchase_courses')
@Unique(['purchaseId', 'courseId'])
export class PurchaseCourse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  purchaseId!: string;

  @Column('uuid')
  courseId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Purchase, (purchase) => purchase.courses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseId' })
  purchase!: Purchase;

  @ManyToOne(() => Course, (course) => course.purchaseCourses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course!: Course;
}

