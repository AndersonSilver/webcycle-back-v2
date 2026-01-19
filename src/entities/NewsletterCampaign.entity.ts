import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';

@Entity('newsletter_campaigns')
export class NewsletterCampaign {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ctaText?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  ctaLink?: string;

  @Column({ type: 'int', default: 0 })
  totalRecipients!: number;

  @Column({ type: 'int', default: 0 })
  sentCount!: number;

  @Column({ type: 'int', default: 0 })
  failedCount!: number;

  @Column({ type: 'jsonb', nullable: true })
  recipientEmails?: string[]; // Lista de emails que receberam

  @Column({ type: 'jsonb', nullable: true })
  failedEmails?: string[]; // Lista de emails que falharam

  @Column({ type: 'uuid', nullable: true })
  sentByUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sentByUserId' })
  sentByUser?: User;

  @CreateDateColumn()
  sentAt!: Date;
}

