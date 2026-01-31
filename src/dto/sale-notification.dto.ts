import { IsArray, IsBoolean, IsEmail, IsOptional } from 'class-validator';

export class UpdateSaleNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  recipientEmails?: string[];
}

