import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ShippingStatus } from '../entities/ShippingTracking.entity';

export class UpdateTrackingStatusDto {
  @IsEnum(ShippingStatus)
  status!: ShippingStatus;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;
}

