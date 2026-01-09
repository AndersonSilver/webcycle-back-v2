import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SupportTicket } from './SupportTicket.entity';
import { User } from './User.entity';

export enum SenderType {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('support_messages')
export class SupportMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  ticketId!: string;

  @ManyToOne(() => SupportTicket, (ticket) => ticket.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticketId' })
  ticket!: SupportTicket;

  @Column()
  senderId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender!: User;

  @Column({
    type: 'enum',
    enum: SenderType,
  })
  senderType!: SenderType;

  @Column('text')
  content!: string;

  @Column({ default: false })
  read!: boolean;

  @Column({ nullable: true })
  readAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}

