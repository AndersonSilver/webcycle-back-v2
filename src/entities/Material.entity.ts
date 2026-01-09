import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Lesson } from './Lesson.entity';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  lessonId!: string;

  @Column()
  title!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column()
  url!: string;

  @Column()
  type!: string; // pdf, doc, zip, etc

  @Column('bigint')
  size!: number; // em bytes

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Lesson, (lesson) => lesson.materials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson!: Lesson;
}

