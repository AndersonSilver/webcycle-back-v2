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
import { Course } from './Course.entity';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  userId!: string;

  @Column('uuid')
  @Index()
  courseId!: string;

  @Column({ unique: true })
  certificateNumber!: string;

  @CreateDateColumn()
  issuedAt!: Date;

  @Column()
  pdfUrl!: string;

  @Column({ unique: true })
  verificationCode!: string;

  @Column({ nullable: true })
  expiresAt?: Date;

  @ManyToOne(() => User, (user) => user.certificates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Course, (course) => course.certificates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course!: Course;
}

