import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { DiscountType } from '../entities/Coupon.entity';

export class CreateCouponDto {
  @IsString()
  @MinLength(3)
  code!: string;

  @IsNumber()
  @Min(0)
  discount!: number;

  @IsEnum(DiscountType)
  type!: DiscountType;

  @IsOptional()
  expiresAt?: Date;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxUses?: number;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  applicableCourses?: string[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateCouponDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  code?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsEnum(DiscountType)
  @IsOptional()
  type?: DiscountType;

  @IsOptional()
  expiresAt?: Date;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxUses?: number;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  applicableCourses?: string[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

