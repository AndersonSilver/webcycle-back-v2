import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Module } from './Module.entity';
import { Progress } from './Progress.entity';
import { Material } from './Material.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  moduleId!: string;

  @Column()
  title!: string;

  @Column()
  duration!: string;

  @Column()
  videoUrl!: string;

  @Column()
  order!: number;

  @Column({ default: false })
  free!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Module, (module) => module.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module!: Module;

  @OneToMany(() => Progress, (progress) => progress.lesson)
  progress!: Progress[];

  @OneToMany(() => Material, (material) => material.lesson, { cascade: true })
  materials!: Material[];
}

