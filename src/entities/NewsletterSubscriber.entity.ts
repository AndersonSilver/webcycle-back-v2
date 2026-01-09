import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('newsletter_subscribers')
export class NewsletterSubscriber {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index({ unique: true })
  email!: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ nullable: true })
  name?: string;

  @CreateDateColumn()
  subscribedAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

