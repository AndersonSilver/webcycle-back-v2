import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sale_notification_settings')
export class SaleNotificationSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: true })
  active!: boolean;

  @Column('simple-array', { nullable: true, name: 'recipient_emails' })
  recipientEmails?: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

