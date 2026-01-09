import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';
import { Podcast } from './Podcast.entity';

@Entity('user_podcasts')
export class UserPodcast {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  podcastId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Podcast, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'podcastId' })
  podcast!: Podcast;

  @CreateDateColumn()
  addedAt!: Date;
}

