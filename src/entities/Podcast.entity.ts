import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('podcasts')
export class Podcast {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ nullable: true })
  image?: string;

  @Column()
  videoUrl!: string;

  @Column({ nullable: true })
  duration?: string;

  @Column({ default: 0 })
  listens!: number;

  @Column({ default: true })
  active!: boolean;

  @Column('jsonb', { nullable: true })
  tags?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

