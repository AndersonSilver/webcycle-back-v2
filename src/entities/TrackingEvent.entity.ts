import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ShippingTracking } from './ShippingTracking.entity';

@Entity('tracking_events')
export class TrackingEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'tracking_id' })
  trackingId!: string;

  @Column()
  status!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { nullable: true })
  location?: string;

  @Column({ nullable: true })
  timestamp?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => ShippingTracking, (tracking) => tracking.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tracking_id' })
  tracking!: ShippingTracking;
}

