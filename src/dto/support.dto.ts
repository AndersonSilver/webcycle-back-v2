import { IsString, IsNotEmpty, IsOptional, IsEnum, MinLength } from 'class-validator';
import { TicketPriority } from '../entities/SupportTicket.entity';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  subject!: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content!: string;
}

