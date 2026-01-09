import { IsEnum, IsString, IsOptional, IsUUID, MinLength } from 'class-validator';
import { NotificationType } from '../entities/UserNotification.entity';

export class CreateNotificationDto {
  @IsUUID('4')
  userId!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(5)
  message!: string;

  @IsString()
  @IsOptional()
  link?: string;
}

export class UpdateNotificationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  link?: string;
}

